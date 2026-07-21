import { getAdminSession } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import ChatIA from './ChatIA'

export const dynamic = 'force-dynamic'

export default async function IAPage() {
  const { gimnasioId } = await getAdminSession()
  const supabase = createAdminClient()

  const { data: gym } = await supabase
    .from('gimnasios')
    .select('ai_enabled, ai_daily_limit, ai_questions_today, ai_questions_reset_at')
    .eq('id', gimnasioId)
    .single()

  const todayAR = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
  const questionsToday = gym?.ai_questions_reset_at === todayAR ? (gym?.ai_questions_today ?? 0) : 0
  const dailyLimit = gym?.ai_daily_limit ?? 100
  const enabled = gym?.ai_enabled ?? false

  if (!enabled) {
    return (
      <div className="max-w-lg">
        <h2 className="text-2xl font-heading font-extrabold text-navy mb-1">SimpleGym IA</h2>
        <div className="bg-white rounded-2xl shadow-sm px-6 py-10 mt-4 text-center">
          <p className="text-4xl mb-3">🔒</p>
          <p className="text-base font-heading font-bold text-navy mb-2">Complemento no activado</p>
          <p className="text-sm font-body text-navy/50 max-w-xs mx-auto">
            SimpleGym IA no está habilitado para tu gimnasio todavía.
            Contactanos para activarlo.
          </p>
        </div>
      </div>
    )
  }

  return (
    <ChatIA
      consultasRestantes={Math.max(0, dailyLimit - questionsToday)}
      limiteTotal={dailyLimit}
    />
  )
}
