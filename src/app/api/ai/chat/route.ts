import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getGymContext } from '@/lib/gym-context'
import { chat } from '@/services/assistant'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const startTime = Date.now()

  // Auth: replicamos la lógica de getAdminSession sin redirect (contexto API)
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

  // Validar body
  const body = await req.json().catch(() => null)
  const message: unknown = body?.message
  if (!message || typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ error: 'Mensaje requerido.' }, { status: 400 })
  }

  // Verificar IA habilitada y límite diario
  const { data: gymData } = await adminSupabase
    .from('gimnasios')
    .select('ai_enabled, ai_daily_limit, ai_questions_today, ai_questions_reset_at')
    .eq('id', gimnasioId)
    .single()

  if (!gymData?.ai_enabled) {
    return NextResponse.json(
      { error: 'SimpleGym IA no está habilitado para tu gimnasio.' },
      { status: 403 },
    )
  }

  const todayAR = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
  let questionsToday = gymData.ai_questions_today ?? 0

  // Resetear contador si es un día nuevo
  if (gymData.ai_questions_reset_at !== todayAR) {
    await adminSupabase
      .from('gimnasios')
      .update({ ai_questions_today: 0, ai_questions_reset_at: todayAR })
      .eq('id', gimnasioId)
    questionsToday = 0
  }

  const dailyLimit = gymData.ai_daily_limit ?? 100
  if (questionsToday >= dailyLimit) {
    return NextResponse.json(
      { error: `Alcanzaste el límite de ${dailyLimit} consultas diarias. Volvé mañana.` },
      { status: 429 },
    )
  }

  // Llamar al assistant
  try {
    const TIMEOUT_MS = 40_000
    const result = await Promise.race([
      chat(message.trim(), gimnasioId),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(Object.assign(new Error('timeout'), { isTimeout: true })), TIMEOUT_MS),
      ),
    ])
    const responseTimeMs = Date.now() - startTime

    // Haiku pricing: $0.80/MTok input · $4.00/MTok output
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

    return NextResponse.json({
      response: result.response,
      consultasRestantes: dailyLimit - questionsToday - 1,
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
    console.error('[AI chat error]', isOverload ? '529 overloaded' : isTimeout ? 'timeout 40s' : err)
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
