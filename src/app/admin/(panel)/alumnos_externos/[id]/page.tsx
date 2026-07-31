import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSession } from '@/lib/admin-auth'
import RegistrarCobroExternoForm from './RegistrarCobroExternoForm'
import EditarVencimientoForm from './EditarVencimientoForm'
import EditarContactoForm from './EditarContactoForm'

export default async function AlumnoExternoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { gimnasioId } = await getAdminSession()
  const adminSupabase = createAdminClient()

  const [{ data: externo }, { data: cobros }] = await Promise.all([
    adminSupabase
      .from('alumnos_externos')
      .select('id, nombre_completo, fecha_vencimiento, whatsapp, email, fecha_alta')
      .eq('id', id)
      .eq('gimnasio_id', gimnasioId)
      .single(),
    adminSupabase
      .from('cobros_externos')
      .select('id, monto, fecha, metodo, notas, estado')
      .eq('alumno_externo_id', id)
      .eq('gimnasio_id', gimnasioId)
      .order('fecha', { ascending: false })
      .limit(20),
  ])

  if (!externo) notFound()

  const hoy = new Date(
    new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }) + 'T00:00:00'
  )

  function calcBadge(fecha: string | null) {
    if (!fecha) return null
    const dias = Math.ceil((new Date(fecha + 'T00:00:00').getTime() - hoy.getTime()) / 86400000)
    if (dias < 0) return { text: 'Vencida', cn: 'bg-red-100 text-red-600' }
    if (dias === 0) return { text: 'Vence hoy', cn: 'bg-orange/20 text-orange' }
    if (dias <= 7) return { text: `${dias}d`, cn: 'bg-orange/20 text-orange' }
    return { text: `${dias}d`, cn: 'bg-green-100 text-green-700' }
  }

  const membresiaBadge = calcBadge(externo.fecha_vencimiento)

  return (
    <>
      <div className="mb-6">
        <Link
          href="/admin/alumnos"
          className="text-sm text-navy/50 hover:text-navy font-body transition-colors"
        >
          ← Volver a alumnos
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm px-6 py-6 max-w-lg">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h2 className="text-xl font-heading font-bold text-navy">
            {externo.nombre_completo}
          </h2>
          <span className="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold font-body bg-navy/10 text-navy/60">
            Importado
          </span>
        </div>

        {/* Contacto */}
        <div className="mb-3 space-y-1">
          {externo.whatsapp && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-body text-navy/50">WhatsApp</span>
              <span className="text-sm font-body text-navy">{externo.whatsapp}</span>
              <a
                href={`https://wa.me/${externo.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold font-body text-green-600 hover:underline"
              >
                Abrir →
              </a>
            </div>
          )}
          {externo.email && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-body text-navy/50">Email</span>
              <span className="text-sm font-body text-navy">{externo.email}</span>
            </div>
          )}
          <EditarContactoForm
            externoId={externo.id}
            whatsappActual={externo.whatsapp ?? null}
            emailActual={externo.email ?? null}
          />
        </div>

        {/* Membresía */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <span className="text-xs font-body text-navy/50">Membresía:</span>
          {membresiaBadge ? (
            <span className={`text-xs font-semibold font-body px-2 py-0.5 rounded-full ${membresiaBadge.cn}`}>
              {membresiaBadge.text}
            </span>
          ) : (
            <span className="text-xs text-navy/30 font-body">sin fecha</span>
          )}
          {externo.fecha_vencimiento && (
            <span className="text-xs text-navy/40 font-body tabular-nums">
              ({new Date(externo.fecha_vencimiento + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })})
            </span>
          )}
        </div>

        <EditarVencimientoForm
          externoId={externo.id}
          fechaVencimientoActual={externo.fecha_vencimiento}
        />

        {/* Cobros */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-xs font-semibold font-body text-navy/40 uppercase tracking-widest mb-4">
            Cobros
          </p>
          <RegistrarCobroExternoForm
            externoId={externo.id}
            fechaVencimientoActual={externo.fecha_vencimiento}
          />
          {cobros && cobros.length > 0 && (
            <ul className="mt-4 space-y-2">
              {cobros.map((c) => {
                const anulado = c.estado === 'anulado'
                return (
                  <li
                    key={c.id}
                    className={`flex items-start justify-between gap-2 py-2 border-b border-gray-50 last:border-0 ${anulado ? 'opacity-50' : ''}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm font-heading font-bold ${anulado ? 'line-through text-navy/40' : 'text-navy'}`}>
                          ${c.monto.toLocaleString('es-AR')}
                        </p>
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
                      <p className="text-xs text-navy/50 font-body tabular-nums">
                        {new Date(c.fecha + 'T00:00:00').toLocaleDateString('es-AR', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                        })}
                      </p>
                      <span className="text-xs font-body bg-navy/5 text-navy/50 px-2 py-0.5 rounded-full capitalize">
                        {c.metodo}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}
