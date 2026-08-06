import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSession } from '@/lib/admin-auth'
import { canUse, getRequiredPlanLabel } from '@/lib/plan-features'
import UpgradeGate from '@/components/UpgradeGate'
import Link from 'next/link'
import { DIAS_SEMANA } from '../types'
import HorariosHabitualesClient from './HorariosHabitualesClient'

export const dynamic = 'force-dynamic'

export default async function HorariosHabitualesPage() {
  const { gimnasioId, plan } = await getAdminSession()

  if (!canUse(plan, 'clases')) {
    return <UpgradeGate requiredPlan={getRequiredPlanLabel('clases')} />
  }

  const supabase = createAdminClient()

  const { data: versiones } = await supabase
    .from('clases_versiones')
    .select(`
      id,
      serie_id,
      dia_semana,
      hora_inicio,
      duracion_minutos,
      cupo_maximo,
      instructor,
      descripcion,
      fecha_desde,
      clases_series!inner (
        id,
        nombre,
        activa,
        gimnasio_id
      )
    `)
    .eq('clases_series.gimnasio_id', gimnasioId)
    .eq('clases_series.activa', true)
    .is('fecha_hasta', null)
    .order('hora_inicio')

  type VersionRow = {
    id: string
    serie_id: string
    dia_semana: number
    hora_inicio: string
    duracion_minutos: number
    cupo_maximo: number
    instructor: string
    descripcion: string | null
    fecha_desde: string
    clases_series: { id: string; nombre: string; activa: boolean; gimnasio_id: string }
  }

  // Group by dia_semana (1=Mon … 7=Sun)
  const porDia: Record<number, VersionRow[]> = {}
  for (let d = 1; d <= 7; d++) porDia[d] = []
  for (const v of (versiones as unknown as VersionRow[]) ?? []) {
    porDia[v.dia_semana] = [...(porDia[v.dia_semana] ?? []), v]
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/clases" className="text-navy/40 hover:text-navy transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h2 className="text-2xl font-heading font-extrabold text-navy">Horarios habituales</h2>
          </div>
          <p className="text-xs font-body text-navy/40 pl-6">
            Clases que se repiten cada semana en el mismo horario.
          </p>
        </div>
      </div>

      <HorariosHabitualesClient porDia={porDia} diasSemana={DIAS_SEMANA} />
    </div>
  )
}
