import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSession } from '@/lib/admin-auth'
import AnularCobroModal from './AnularCobroModal'

export const dynamic = 'force-dynamic'

const METODO_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
  otro: 'Otro',
}

export default async function CobrosPage() {
  const { gimnasioId } = await getAdminSession()
  const adminSupabase = createAdminClient()

  const hoyAR = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
  const hoy = new Date(hoyAR + 'T00:00:00')
  const en7dias = new Date(hoy)
  en7dias.setDate(hoy.getDate() + 7)
  const en7diasStr = en7dias.toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })

  // First of this month
  const primerDiaMes = hoyAR.slice(0, 7) + '-01'

  const [
    { data: vencidos },
    { data: porVencer },
    { data: cobrosMes },
    { data: alumnosMap },
  ] = await Promise.all([
    adminSupabase
      .from('alumnos')
      .select('id, nombre_completo, fecha_vencimiento')
      .eq('gimnasio_id', gimnasioId)
      .not('fecha_vencimiento', 'is', null)
      .lt('fecha_vencimiento', hoyAR)
      .order('fecha_vencimiento', { ascending: true }),
    adminSupabase
      .from('alumnos')
      .select('id, nombre_completo, fecha_vencimiento')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha_vencimiento', hoyAR)
      .lte('fecha_vencimiento', en7diasStr)
      .order('fecha_vencimiento', { ascending: true }),
    adminSupabase
      .from('cobros')
      .select('id, alumno_id, monto, fecha, metodo, notas, estado')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha', primerDiaMes)
      .order('fecha', { ascending: false }),
    adminSupabase
      .from('alumnos')
      .select('id, nombre_completo')
      .eq('gimnasio_id', gimnasioId),
  ])

  const nombreMap = new Map((alumnosMap ?? []).map((a) => [a.id, a.nombre_completo]))
  const cobrosActivos = (cobrosMes ?? []).filter((c) => c.estado !== 'anulado')
  const totalMes = cobrosActivos.reduce((sum, c) => sum + c.monto, 0)

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h2 className="text-2xl font-heading font-extrabold text-navy">Cobros</h2>
      </div>

      {/* Resumen del mes */}
      <div className="bg-white rounded-2xl shadow-sm px-6 py-5">
        <p className="text-xs font-body font-semibold tracking-widest text-orange uppercase mb-3">
          Este mes
        </p>
        <div className="flex items-end gap-1">
          <span className="text-3xl font-heading font-extrabold text-navy">
            ${totalMes.toLocaleString('es-AR')}
          </span>
          <span className="text-sm text-navy/40 font-body mb-1">
            · {cobrosActivos.length} cobro{cobrosActivos.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Vencidos */}
      {(vencidos ?? []).length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm px-6 py-5">
          <p className="text-xs font-body font-semibold tracking-widest text-red-500 uppercase mb-3">
            Membresía vencida ({vencidos!.length})
          </p>
          <ul className="space-y-2">
            {vencidos!.map((a) => {
              const dias = Math.ceil(
                (hoy.getTime() - new Date(a.fecha_vencimiento! + 'T00:00:00').getTime()) / 86400000
              )
              return (
                <li key={a.id} className="flex items-center justify-between">
                  <Link
                    href={`/admin/alumnos/${a.id}`}
                    className="text-sm font-body text-navy hover:text-orange transition-colors"
                  >
                    {a.nombre_completo}
                  </Link>
                  <span className="text-xs font-body text-red-500 tabular-nums">
                    hace {dias}d
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Por vencer */}
      {(porVencer ?? []).length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm px-6 py-5">
          <p className="text-xs font-body font-semibold tracking-widest text-orange uppercase mb-3">
            Por vencer (próximos 7 días)
          </p>
          <ul className="space-y-2">
            {porVencer!.map((a) => {
              const dias = Math.ceil(
                (new Date(a.fecha_vencimiento! + 'T00:00:00').getTime() - hoy.getTime()) / 86400000
              )
              return (
                <li key={a.id} className="flex items-center justify-between">
                  <Link
                    href={`/admin/alumnos/${a.id}`}
                    className="text-sm font-body text-navy hover:text-orange transition-colors"
                  >
                    {a.nombre_completo}
                  </Link>
                  <span className="text-xs font-body text-orange tabular-nums">
                    en {dias}d
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {(vencidos ?? []).length === 0 && (porVencer ?? []).length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm px-6 py-5">
          <p className="text-sm text-navy/40 font-body">Todo al día. No hay membresías vencidas ni por vencer esta semana.</p>
        </div>
      )}

      {/* Historial del mes */}
      <div className="bg-white rounded-2xl shadow-sm px-6 py-5">
        <p className="text-xs font-body font-semibold tracking-widest text-orange uppercase mb-3">
          Historial del mes
        </p>
        {!cobrosMes || cobrosMes.length === 0 ? (
          <p className="text-navy/40 font-body text-sm">Sin cobros registrados este mes.</p>
        ) : (
          <ul className="space-y-2">
            {cobrosMes.map((c) => {
              const anulado = c.estado === 'anulado'
              const alumnoNombre = nombreMap.get(c.alumno_id) ?? '—'
              return (
                <li key={c.id} className={`flex items-start justify-between gap-2 py-2 border-b border-gray-50 last:border-0 ${anulado ? 'opacity-50' : ''}`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/admin/alumnos/${c.alumno_id}`}
                        className="text-sm font-body font-medium text-navy hover:text-orange transition-colors"
                      >
                        {alumnoNombre}
                      </Link>
                      {anulado && (
                        <span className="text-xs font-body bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full">
                          Anulado
                        </span>
                      )}
                    </div>
                    {c.notas && (
                      <p className="text-xs text-navy/40 font-body">{c.notas}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <p className={`text-sm font-heading font-bold ${anulado ? 'line-through text-navy/40' : 'text-navy'}`}>
                      ${c.monto.toLocaleString('es-AR')}
                    </p>
                    <p className="text-xs text-navy/40 font-body tabular-nums">
                      {new Date(c.fecha + 'T00:00:00').toLocaleDateString('es-AR', {
                        day: '2-digit', month: '2-digit',
                      })}
                      {' · '}
                      {METODO_LABELS[c.metodo] ?? c.metodo}
                    </p>
                    {!anulado && (
                      <AnularCobroModal
                        cobroId={c.id}
                        monto={c.monto}
                        alumnoNombre={alumnoNombre}
                      />
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
