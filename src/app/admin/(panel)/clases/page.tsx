import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSession } from '@/lib/admin-auth'
import { canUse, getRequiredPlanLabel } from '@/lib/plan-features'
import UpgradeGate from '@/components/UpgradeGate'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ClasesPage() {
  const { gimnasioId, plan } = await getAdminSession()

  if (!canUse(plan, 'clases')) {
    return <UpgradeGate requiredPlan={getRequiredPlanLabel('clases')} />
  }

  const adminSupabase = createAdminClient()
  const ahoraUTC = new Date().toISOString()

  const [{ data: clases }, { data: reservasRows }] = await Promise.all([
    adminSupabase
      .from('clases')
      .select('*')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha_hora', ahoraUTC)
      .order('fecha_hora')
      .limit(100),
    adminSupabase
      .from('reservas')
      .select('clase_id')
      .eq('gimnasio_id', gimnasioId)
      .eq('estado', 'confirmada'),
  ])

  const ocupadosMap: Record<string, number> = {}
  for (const r of reservasRows ?? []) {
    ocupadosMap[r.clase_id] = (ocupadosMap[r.clase_id] ?? 0) + 1
  }

  const hoyAR = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })

  const grupos: Record<string, typeof clases> = {}
  for (const c of clases ?? []) {
    const fecha = new Date(c.fecha_hora).toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
    if (!grupos[fecha]) grupos[fecha] = []
    grupos[fecha]!.push(c)
  }
  const fechasOrdenadas = Object.keys(grupos).sort()

  function labelFecha(fechaStr: string): string {
    if (fechaStr === hoyAR) return 'Hoy'
    const mañanaDt = new Date(hoyAR + 'T00:00:00-03:00')
    mañanaDt.setDate(mañanaDt.getDate() + 1)
    const mañanaStr = mañanaDt.toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
    if (fechaStr === mañanaStr) return 'Mañana'
    return new Date(fechaStr + 'T12:00:00Z').toLocaleDateString('es-AR', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-heading font-extrabold text-navy">Clases</h2>
        <Link
          href="/admin/clases/nueva"
          className="flex-shrink-0 px-4 py-2 rounded-xl bg-orange text-white text-sm font-heading font-bold hover:bg-orange/90 transition-colors"
        >
          + Nueva clase
        </Link>
      </div>

      {fechasOrdenadas.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm px-6 py-10 text-center">
          <p className="text-navy/40 font-body text-sm">No hay clases programadas.</p>
          <p className="text-navy/30 font-body text-xs mt-1">Creá la primera con el botón de arriba.</p>
        </div>
      ) : (
        fechasOrdenadas.map(fecha => (
          <div key={fecha}>
            <p className="text-xs font-body font-semibold tracking-widest text-navy/50 uppercase mb-2 capitalize">
              {labelFecha(fecha)}
            </p>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {(grupos[fecha] ?? []).map((clase, i) => {
                const ocupados = ocupadosMap[clase.id] ?? 0
                const hora = new Date(clase.fecha_hora).toLocaleTimeString('es-AR', {
                  timeZone: 'America/Argentina/Buenos_Aires',
                  hour: '2-digit', minute: '2-digit',
                })
                const sinCupo = ocupados >= clase.capacidad_max

                return (
                  <Link
                    key={clase.id}
                    href={`/admin/clases/${clase.id}`}
                    className={`flex items-center gap-4 px-5 py-4 hover:bg-navy/[0.02] transition-colors ${i > 0 ? 'border-t border-gray-100' : ''}`}
                  >
                    <div className="flex-shrink-0 text-center w-12">
                      <p className="text-base font-heading font-extrabold text-navy tabular-nums">{hora}</p>
                      <p className="text-xs font-body text-navy/40">{clase.duracion_min}′</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-semibold text-sm text-navy truncate">{clase.titulo}</p>
                      {clase.instructor && (
                        <p className="text-xs font-body text-navy/50 truncate">{clase.instructor}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span className={`text-xs font-body font-semibold px-2 py-1 rounded-full ${
                        clase.cancelada
                          ? 'bg-red-100 text-red-500'
                          : sinCupo
                          ? 'bg-navy/10 text-navy/60'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {clase.cancelada ? 'Cancelada' : `${ocupados}/${clase.capacidad_max}`}
                      </span>
                    </div>
                    <svg className="w-4 h-4 text-navy/20 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
