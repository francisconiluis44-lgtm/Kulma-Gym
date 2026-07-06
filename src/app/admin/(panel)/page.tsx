import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function AdminAlumnosPage() {
  const adminSupabase = createAdminClient()
  const { data: alumnos } = await adminSupabase
    .from('alumnos')
    .select('id, nombre_completo, dni, whatsapp, fecha_alta, fecha_vencimiento, rutina_fecha_vencimiento')
    .order('fecha_alta', { ascending: false })

  const hoy = new Date(new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }) + 'T00:00:00')

  function rutinaStatusDot(fecha: string | null) {
    if (!fecha) return { cn: 'bg-gray-300', title: 'Sin fecha de rutina' }
    const dias = Math.ceil((new Date(fecha + 'T00:00:00').getTime() - hoy.getTime()) / 86400000)
    if (dias < 0) return { cn: 'bg-red-500', title: `Rutina vencida (${Math.abs(dias)}d)` }
    if (dias <= 7) return { cn: 'bg-orange', title: `Rutina vence en ${dias}d` }
    return { cn: 'bg-green-500', title: `Rutina ok (${dias}d)` }
  }

  return (
    <>
      <div className="mb-6 flex items-baseline gap-3">
        <h2 className="text-2xl font-heading font-bold text-navy">Alumnos</h2>
        <span className="text-sm text-navy/50 font-body">
          {alumnos?.length ?? 0} en total
        </span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {!alumnos || alumnos.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-navy/40 font-body text-sm">
              No hay alumnos registrados todavía.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy text-white">
                  <th className="px-5 py-3.5 text-left font-heading font-semibold text-sm">
                    Nombre
                  </th>
                  <th className="px-5 py-3.5 text-left font-heading font-semibold text-sm hidden sm:table-cell">
                    DNI
                  </th>
                  <th className="px-5 py-3.5 text-left font-heading font-semibold text-sm hidden md:table-cell">
                    Vencimiento
                  </th>
                  <th className="px-5 py-3.5 text-left font-heading font-semibold text-sm">
                    Alta
                  </th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {alumnos.map((alumno) => {
                  const venc = alumno.fecha_vencimiento
                    ? new Date(alumno.fecha_vencimiento + 'T00:00:00')
                    : null
                  const diasRestantes = venc
                    ? Math.ceil((venc.getTime() - hoy.getTime()) / 86400000)
                    : null

                  return (
                    <tr key={alumno.id} className="hover:bg-cream/60 transition-colors">
                      <td className="px-5 py-4 font-body font-medium text-navy">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${rutinaStatusDot(alumno.rutina_fecha_vencimiento).cn}`}
                            title={rutinaStatusDot(alumno.rutina_fecha_vencimiento).title}
                          />
                          {alumno.nombre_completo}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-body text-navy/60 tabular-nums hidden sm:table-cell">
                        {alumno.dni}
                      </td>
                      <td className="px-5 py-4 font-body text-sm hidden md:table-cell">
                        {venc ? (
                          <span
                            className={
                              diasRestantes !== null && diasRestantes < 0
                                ? 'text-red-500 font-semibold'
                                : diasRestantes !== null && diasRestantes <= 7
                                  ? 'text-orange font-semibold'
                                  : 'text-navy/60'
                            }
                          >
                            {venc.toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                            {diasRestantes !== null && diasRestantes < 0
                              ? ' (vencido)'
                              : diasRestantes !== null && diasRestantes <= 7
                                ? ` (${diasRestantes}d)`
                                : ''}
                          </span>
                        ) : (
                          <span className="text-navy/30">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-body text-navy/50 text-xs tabular-nums">
                        {new Date(alumno.fecha_alta).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/alumnos/${alumno.id}`}
                          className="text-xs font-semibold text-orange hover:underline font-body"
                        >
                          Editar
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
