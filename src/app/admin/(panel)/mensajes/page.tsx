import { createAdminClient } from '@/lib/supabase/admin'
import ResponderForm from './ResponderForm'
import NuevoMensajeForm from './NuevoMensajeForm'

export default async function MensajesAdminPage() {
  const adminSupabase = createAdminClient()

  const [{ data: mensajes }, { data: alumnos }] = await Promise.all([
    adminSupabase
      .from('mensajes')
      .select('id, cuerpo, leido, created_at, respuesta, respondido_at, alumno_id, alumnos(nombre_completo, dni)')
      .order('created_at', { ascending: false }),
    adminSupabase
      .from('alumnos')
      .select('id, nombre_completo')
      .order('nombre_completo', { ascending: true }),
  ])

  const unreadIds = (mensajes ?? []).filter((m) => !m.leido).map((m) => m.id)
  if (unreadIds.length > 0) {
    await adminSupabase.from('mensajes').update({ leido: true }).in('id', unreadIds)
  }

  return (
    <>
      <h2 className="text-2xl font-heading font-bold text-navy mb-6">Mensajes</h2>

      <NuevoMensajeForm alumnos={alumnos ?? []} />

      <h3 className="text-base font-heading font-semibold text-navy mb-3">
        Recibidos de alumnos
      </h3>

      <div className="space-y-4">
        {!mensajes || mensajes.length === 0 ? (
          <p className="text-navy/40 font-body text-sm text-center py-8 bg-white rounded-2xl">
            No hay mensajes todavía.
          </p>
        ) : (
          mensajes.map((m) => {
            const alumno = Array.isArray(m.alumnos) ? m.alumnos[0] : m.alumnos
            return (
              <div
                key={m.id}
                className={`bg-white rounded-2xl shadow-sm px-6 py-5 border-l-4 ${
                  !m.leido ? 'border-l-orange' : m.respuesta ? 'border-l-green-400' : 'border-l-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-body font-semibold text-navy text-sm">
                    {alumno?.nombre_completo ?? 'Alumno'}
                    <span className="text-navy/40 font-normal ml-2">DNI {alumno?.dni}</span>
                  </p>
                  <p className="text-xs text-navy/40 font-body tabular-nums">
                    {new Date(m.created_at).toLocaleDateString('es-AR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
                <p className="text-sm text-navy/70 font-body whitespace-pre-wrap">{m.cuerpo}</p>
                <ResponderForm mensajeId={m.id} respuestaActual={m.respuesta} />
              </div>
            )
          })
        )}
      </div>
    </>
  )
}
