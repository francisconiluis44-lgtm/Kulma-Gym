import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export default async function MensajesAdminPage() {
  const adminSupabase = createAdminClient()

  const { data: mensajes } = await adminSupabase
    .from('mensajes')
    .select('id, cuerpo, leido, created_at, alumno_id, alumnos(nombre_completo, dni)')
    .order('created_at', { ascending: false })

  // Mark all as read
  const unreadIds = (mensajes ?? []).filter((m) => !m.leido).map((m) => m.id)
  if (unreadIds.length > 0) {
    await adminSupabase.from('mensajes').update({ leido: true }).in('id', unreadIds)
    revalidatePath('/admin/mensajes')
  }

  return (
    <>
      <h2 className="text-2xl font-heading font-bold text-navy mb-6">
        Mensajes de alumnos
      </h2>

      <div className="space-y-4">
        {!mensajes || mensajes.length === 0 ? (
          <p className="text-navy/40 font-body text-sm text-center py-8">
            No hay mensajes todavía.
          </p>
        ) : (
          mensajes.map((m) => {
            const alumno = Array.isArray(m.alumnos) ? m.alumnos[0] : m.alumnos
            return (
              <div
                key={m.id}
                className={`bg-white rounded-2xl shadow-sm px-6 py-5 border-l-4 transition-colors ${
                  m.leido ? 'border-l-gray-200' : 'border-l-orange'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-body font-semibold text-navy text-sm">
                    {alumno?.nombre_completo ?? 'Alumno'}
                    <span className="text-navy/40 font-normal ml-2">
                      DNI {alumno?.dni}
                    </span>
                  </p>
                  <p className="text-xs text-navy/40 font-body tabular-nums">
                    {new Date(m.created_at).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <p className="text-sm text-navy/70 font-body whitespace-pre-wrap">
                  {m.cuerpo}
                </p>
              </div>
            )
          })
        )}
      </div>
    </>
  )
}
