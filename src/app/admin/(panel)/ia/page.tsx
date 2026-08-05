import { getAdminSession } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import ChatIA from './ChatIA'

export const dynamic = 'force-dynamic'

const FREE_DAILY_LIMIT = 3
const PAID_DAILY_LIMIT = 25

export type IAStatus =
  | { tipo: 'trial'; diasRestantes: number; consultasRestantes: number }
  | { tipo: 'paid'; hasta: string; consultasRestantes: number }
  | { tipo: 'free'; consultasRestantes: number }

export default async function IAPage() {
  const { gimnasioId } = await getAdminSession()
  const supabase = createAdminClient()

  const { data: gym } = await supabase
    .from('gimnasios')
    .select('ai_enabled, ai_questions_today, ai_questions_reset_at, ai_trial_start, ai_paid_until')
    .eq('id', gimnasioId)
    .single()

  if (!gym?.ai_enabled) {
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

  const todayAR = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
  const questionsToday = gym.ai_questions_reset_at === todayAR ? (gym.ai_questions_today ?? 0) : 0

  let status: IAStatus

  if (gym.ai_paid_until && todayAR <= gym.ai_paid_until) {
    status = { tipo: 'paid', hasta: gym.ai_paid_until, consultasRestantes: Math.max(0, PAID_DAILY_LIMIT - questionsToday) }
  } else if (gym.ai_trial_start) {
    const startDate = new Date(
      new Date(gym.ai_trial_start).toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }) + 'T00:00:00',
    )
    startDate.setDate(startDate.getDate() + 2)
    const trialEndDateAR = startDate.toISOString().slice(0, 10)
    if (todayAR <= trialEndDateAR) {
      const todayDate = new Date(todayAR + 'T00:00:00')
      const endDate = new Date(trialEndDateAR + 'T00:00:00')
      const diasRestantes = Math.round((endDate.getTime() - todayDate.getTime()) / 86400000) + 1
      status = { tipo: 'trial', diasRestantes, consultasRestantes: Math.max(0, PAID_DAILY_LIMIT - questionsToday) }
    } else {
      status = { tipo: 'free', consultasRestantes: Math.max(0, FREE_DAILY_LIMIT - questionsToday) }
    }
  } else {
    // Trial hasn't started yet — first message will set ai_trial_start
    status = { tipo: 'trial', diasRestantes: 3, consultasRestantes: PAID_DAILY_LIMIT }
  }

  return <ChatIA status={status} />
}
