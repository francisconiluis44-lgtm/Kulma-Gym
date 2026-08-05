import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getGymContext } from '@/lib/gym-context'
import { chat } from '@/services/assistant'

export const dynamic = 'force-dynamic'

const FREE_DAILY_LIMIT = 3
const PAID_DAILY_LIMIT = 25

function getAITier(gymData: {
  ai_trial_start: string | null
  ai_paid_until: string | null
}, todayAR: string): 'trial' | 'paid' | 'free' {
  if (gymData.ai_paid_until && todayAR <= gymData.ai_paid_until) return 'paid'
  if (gymData.ai_trial_start) {
    const startDate = new Date(gymData.ai_trial_start + 'T00:00:00')
    startDate.setDate(startDate.getDate() + 2)
    const trialEndDateAR = startDate.toISOString().slice(0, 10)
    if (todayAR <= trialEndDateAR) return 'trial'
  }
  return 'free'
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const gym = await getGymContext()
  const adminSupabase = createAdminClient()

  const { data: gymAdmin } = await adminSupabase
    .from('gym_admins')
    .select('gimnasio_id')
    .eq('user_id', user.id)
    .eq('gimnasio_id', gym.id)
    .single()

  if (!gymAdmin) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const gimnasioId = gymAdmin.gimnasio_id
  const userId = user.id

  const body = await req.json().catch(() => null)
  const message: unknown = body?.message
  if (!message || typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ error: 'Mensaje requerido.' }, { status: 400 })
  }

  const rawHistory: unknown = body?.history
  const history: Array<{ role: 'user' | 'assistant'; content: string }> = Array.isArray(rawHistory)
    ? rawHistory
        .filter((m): m is { role: string; content: string } =>
          m && typeof m === 'object' && typeof m.role === 'string' && typeof m.content === 'string',
        )
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content.slice(0, 2000) }))
        .slice(-6)
    : []

  const { data: gymData } = await adminSupabase
    .from('gimnasios')
    .select('ai_enabled, ai_daily_limit, ai_questions_today, ai_questions_reset_at, ai_trial_start, ai_paid_until')
    .eq('id', gimnasioId)
    .single()

  if (!gymData?.ai_enabled) {
    return NextResponse.json(
      { error: 'SimpleGym IA no está habilitado para tu gimnasio.' },
      { status: 403 },
    )
  }

  const todayAR = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })

  let trialStart = gymData.ai_trial_start
  let questionsToday = gymData.ai_questions_today ?? 0
  const needsTrialStart = !gymData.ai_trial_start
  const needsDayReset = gymData.ai_questions_reset_at !== todayAR

  if (needsTrialStart || needsDayReset) {
    trialStart = gymData.ai_trial_start ?? new Date().toISOString()
    await adminSupabase
      .from('gimnasios')
      .update({
        ...(needsTrialStart ? { ai_trial_start: trialStart } : {}),
        ...(needsDayReset ? { ai_questions_today: 0, ai_questions_reset_at: todayAR } : {}),
      })
      .eq('id', gimnasioId)
    if (needsDayReset) questionsToday = 0
  }
  const tier = getAITier(
    { ai_trial_start: trialStart ?? null, ai_paid_until: gymData.ai_paid_until },
    todayAR,
  )

  const dailyLimit = tier === 'free' ? FREE_DAILY_LIMIT : PAID_DAILY_LIMIT
  if (questionsToday >= dailyLimit) {
    const msg = tier === 'free'
      ? `Alcanzaste el límite de ${FREE_DAILY_LIMIT} consultas diarias del plan gratuito.`
      : `Alcanzaste el límite de ${PAID_DAILY_LIMIT} consultas diarias. Volvé mañana.`
    return NextResponse.json({ error: msg }, { status: 429 })
  }

  try {
    const TIMEOUT_MS = 55_000
    const result = await Promise.race([
      chat(message.trim(), gimnasioId, history),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(Object.assign(new Error('timeout'), { isTimeout: true })), TIMEOUT_MS),
      ),
    ])
    const responseTimeMs = Date.now() - startTime

    const estimatedCost = result.tokensIn * 0.0000008 + result.tokensOut * 0.000004

    await Promise.all([
      adminSupabase
        .from('gimnasios')
        .update({ ai_questions_today: questionsToday + 1 })
        .eq('id', gimnasioId),
      adminSupabase.from('ai_usage').insert({
        gimnasio_id: gimnasioId,
        user_id: userId,
        question: message.slice(0, 500),
        tool_used: result.toolUsed,
        input_tokens: result.tokensIn,
        output_tokens: result.tokensOut,
        estimated_cost: estimatedCost,
        response_time_ms: responseTimeMs,
        success: true,
      }),
    ])

    const consultasRestantes = dailyLimit - questionsToday - 1

    return NextResponse.json({
      response: result.response,
      consultasRestantes,
      tier,
    })
  } catch (err) {
    const responseTimeMs = Date.now() - startTime
    adminSupabase.from('ai_usage').insert({
      gimnasio_id: gimnasioId,
      user_id: userId,
      question: message.slice(0, 500),
      tool_used: null,
      input_tokens: 0,
      output_tokens: 0,
      estimated_cost: 0,
      response_time_ms: responseTimeMs,
      success: false,
    }).then(() => {}, () => {})

    const isOverload = err instanceof Error && 'status' in err && (err as { status: number }).status === 529
    const isTimeout = err instanceof Error && 'isTimeout' in err
    console.error('[AI chat error]', isOverload ? '529 overloaded' : isTimeout ? 'timeout 55s' : err)
    return NextResponse.json(
      {
        error: isOverload
          ? 'La IA está sobrecargada en este momento. Intentá de nuevo en 1–2 minutos.'
          : isTimeout
            ? 'La consulta tardó demasiado. Intentá con una pregunta más específica.'
            : 'No pude analizar la información en este momento. Intentá nuevamente en unos minutos.',
      },
      { status: isOverload ? 503 : isTimeout ? 504 : 500 },
    )
  }
}
