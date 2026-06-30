import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function MembresiasPage() {
  const adminSupabase = createAdminClient()
  const { data: alumnos } = await adminSupabase
    .from('alumnos')
    .select('id, nombre_completo, dni, whatsapp, fecha_vencimiento')
    .order('fecha_vencimiento', { ascending: true })

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const conFecha = (alumnos ?? []).filter((a) => a.fecha_vencimiento)
  const sinFecha = (alumnos ?? []).filter((a) => !a.fecha_vencimiento)

  function diasRestantes(fecha: string) {
    const d = new Date(fecha + 'T00:00:00')
    return Math.ceil((d.getTime() - hoy.getTime()) / 86400000)
  }

  function badge(dias: number) {
    if (dias < 0) return { label: 'Vencida', cn: 'bg-red-100 text-red-600' }
    if (dias === 0) return { label: 'Vence hoy', cn: 'bg-orange/20 text-orange' }
    if (dias <= 7) return { label: `${dias}d`, cn: 'bg-orange/20 text-orange' }
    return { label: `${dias}d`, cn: 'bg-green-100 text-green-700' }
  }

  return (
    <>
      <div className="mb-6 flex items-baseline gap-3">
        <h2 className="text-2xl font-heading font-bold text-navy">Membresías</h2>
        <span className="text-sm text-navy/50 font-body">
          {conFecha.length} con fecha · {sinFecha.length} sin fecha
        </span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="px-5 py-3 bg-navy/5 border-b border-gray-100">
          <p className="text-xs font-semibold font-body text-navy/50 uppercase tracking-widest">
            Con fecha de vencimiento
          </p>
        </div>
        {conFecha.length === 0 ? (
          <p className="px-5 py-8 text-center text-navy/40 font-body text-sm">
            Ningún alumno tiene fecha cargada.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {conFecha.map((a) => {
              const dias = diasRestantes(a.fecha_vencimiento!)
              const { label, cn } = badge(dias)
              return (
                <div key={a.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-medium text-navy text-sm">
                      {a.nombre_completo}
                    </p>
                    <p className="text-xs text-navy/50 font-body">DNI {a.dni}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-navy/50 font-body tabular-nums mb-0.5">
                      {new Date(a.fecha_vencimiento! + 'T00:00:00').toLocaleDateString(
                        'es-AR',
                        { day: '2-digit', month: '2-digit', year: 'numeric' }
                      )}
                    </p>
                    <span className={`inline-block text-xs font-semibold font-body px-2 py-0.5 rounded-full ${cn}`}>
                      {label}
                    </span>
                  </div>
                  <Link
                    href={`/admin/alumnos/${a.id}`}
                    className="text-xs font-semibold text-orange hover:underline font-body shrink-0"
                  >
                    Editar
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {sinFecha.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-navy/5 border-b border-gray-100">
            <p className="text-xs font-semibold font-body text-navy/50 uppercase tracking-widest">
              Sin fecha cargada
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {sinFecha.map((a) => (
              <div key={a.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <p className="font-body font-medium text-navy text-sm">
                    {a.nombre_completo}
                  </p>
                  <p className="text-xs text-navy/50 font-body">DNI {a.dni}</p>
                </div>
                <Link
                  href={`/admin/alumnos/${a.id}`}
                  className="text-xs font-semibold text-orange hover:underline font-body shrink-0"
                >
                  Cargar fecha
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
