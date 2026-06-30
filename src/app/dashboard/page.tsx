import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { signOut } from '@/app/actions'
import ComentarioForm from './ComentarioForm'
import MensajeForm from './MensajeForm'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminSupabase = createAdminClient()

  const [
    { data: alumno },
    { data: comunicados },
    { data: misMensajes },
    { data: mensajesDelProfe },
    { data: config },
  ] = await Promise.all([
    adminSupabase.from('alumnos').select('*').eq('id', user.id).single(),
    adminSupabase
      .from('comunicados')
      .select('id, titulo, cuerpo, created_at, comentarios(id, cuerpo, created_at, alumno_id, alumnos(nombre_completo))')
      .order('created_at', { ascending: false })
      .limit(20),
    adminSupabase
      .from('mensajes')
      .select('id, cuerpo, created_at, respuesta, respondido_at')
      .eq('alumno_id', user.id)
      .order('created_at', { ascending: false }),
    adminSupabase
      .from('mensajes_admin')
      .select('id, cuerpo, created_at, leido')
      .eq('alumno_id', user.id)
      .order('created_at', { ascending: false }),
    adminSupabase.from('configuracion').select('*').eq('id', 1).single(),
  ])

  const unread = (mensajesDelProfe ?? []).filter((m) => !m.leido).map((m) => m.id)
  if (unread.length > 0) {
    await adminSupabase.from('mensajes_admin').update({ leido: true }).in('id', unread)
  }

  const firstName = alumno?.nombre_completo?.split(' ')[0] ?? 'Alumno'

  function calcDias(fecha: string | null) {
    if (!fecha) return null
    const d = new Date(fecha + 'T00:00:00')
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
    return Math.ceil((d.getTime() - hoy.getTime()) / 86400000)
  }

  const diasMembresia = calcDias(alumno?.fecha_vencimiento ?? null)
  const diasRutina = calcDias(alumno?.rutina_fecha_vencimiento ?? null)

  function diasLabel(dias: number | null) {
    if (dias === null) return null
    if (dias < 0) return { text: 'Vencida', cn: 'text-red-500' }
    if (dias === 0) return { text: 'Vence hoy', cn: 'text-orange' }
    return { text: `${dias} día${dias !== 1 ? 's' : ''} restante${dias !== 1 ? 's' : ''}`, cn: dias <= 7 ? 'text-orange' : 'text-navy' }
  }

  const labelMembresia = diasLabel(diasMembresia)
  const labelRutina = diasLabel(diasRutina)

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-navy text-white px-4 py-4 shadow-md">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs font-body text-orange font-semibold tracking-widest uppercase">Mi gym</p>
            <h1 className="text-xl font-heading font-extrabold leading-tight">KULMA GYM</h1>
          </div>
          <form action={signOut}>
            <button type="submit" className="text-sm font-body text-white/70 hover:text-white transition-colors">
              Salir
            </button>
          </form>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm px-5 py-5">
          <p className="text-sm text-navy/50 font-body">Bienvenido/a,</p>
          <h2 className="text-2xl font-heading font-extrabold text-navy mt-0.5">{firstName} 👋</h2>
        </div>

        <div className="bg-white rounded-2xl shadow-sm px-5 py-5">
          <p className="text-xs font-body font-semibold tracking-widest text-orange uppercase mb-2">Tu rutina</p>
          {alumno?.rutina_url ? (
            <a
              href={alumno.rutina_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-navy font-semibold font-body hover:text-orange transition-colors"
            >
              <span>Ver mi rutina en Google Drive</span>
              <span className="text-lg">↗</span>
            </a>
          ) : (
            <p className="text-navy/40 font-body text-sm">Tu profe todavía no cargó tu rutina.</p>
          )}
          {labelRutina && (
            <p className={`text-sm font-heading font-semibold mt-1 ${labelRutina.cn}`}>
              Rutina: {labelRutina.text}
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm px-5 py-5">
          <p className="text-xs font-body font-semibold tracking-widest text-orange uppercase mb-2">Membresía</p>
          {alumno?.fecha_vencimiento ? (
            <>
              <p className="text-navy/60 font-body text-sm">
                Vence el{' '}
                <span className="font-semibold text-navy">
                  {new Date(alumno.fecha_vencimiento + 'T00:00:00').toLocaleDateString('es-AR', {
                    day: '2-digit', month: 'long', year: 'numeric',
                  })}
                </span>
              </p>
              {labelMembresia && (
                <p className={`text-lg font-heading font-bold mt-0.5 ${labelMembresia.cn}`}>
                  {labelMembresia.text}
                </p>
              )}
            </>
          ) : (
            <p className="text-navy/40 font-body text-sm">Sin fecha de vencimiento registrada.</p>
          )}
        </div>

        {(mensajesDelProfe ?? []).length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm px-5 py-5">
            <p className="text-xs font-body font-semibold tracking-widest text-orange uppercase mb-3">
              Mensajes del profe
            </p>
            <div className="space-y-3">
              {mensajesDelProfe!.map((m) => (
                <div key={m.id} className="bg-navy/5 rounded-xl px-4 py-3">
                  <p className="text-sm text-navy font-body">{m.cuerpo}</p>
                  <p className="text-xs text-navy/40 font-body mt-1 tabular-nums">
                    {new Date(m.created_at).toLocaleDateString('es-AR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-lg font-heading font-bold text-navy mb-3 px-1">Comunicados</h3>
          {!comunicados || comunicados.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm px-5 py-8 text-center">
              <p className="text-navy/40 font-body text-sm">No hay comunicados todavía.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comunicados.map((c) => {
                const comentariosArr = Array.isArray(c.comentarios) ? c.comentarios : []
                return (
                  <div key={c.id} className="bg-white rounded-2xl shadow-sm px-5 py-5">
                    <p className="text-xs text-navy/40 font-body mb-1 tabular-nums">
                      {new Date(c.created_at).toLocaleDateString('es-AR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                      })}
                    </p>
                    <h4 className="font-heading font-semibold text-navy mb-1">{c.titulo}</h4>
                    <p className="text-sm text-navy/70 font-body whitespace-pre-wrap">{c.cuerpo}</p>
                    {comentariosArr.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                        {comentariosArr.map((cm) => {
                          const cmAlumno = Array.isArray(cm.alumnos) ? cm.alumnos[0] : cm.alumnos
                          return (
                            <div key={cm.id} className="flex gap-2">
                              <div className="w-6 h-6 rounded-full bg-orange/20 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-orange">
                                  {(cmAlumno?.nombre_completo ?? 'A')[0]}
                                </span>
  </div>
                              <div>
                                <p className="text-xs font-semibold text-navy font-body">
                                  {cmAlumno?.nombre_completo?.split(' ')[0] ?? 'Alumno'}
                                </p>
                                <p className="text-sm text-navy/70 font-body">{cm.cuerpo}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    <ComentarioForm comunicadoId={c.id} />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm px-5 py-5">
          <p className="text-xs font-body font-semibold tracking-widest text-orange uppercase mb-3">
            Enviar mensaje al profe
          </p>
          <MensajeForm />
          {(misMensajes ?? []).length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              {misMensajes!.map((m) => (
                <div key={m.id} className="space-y-1">
                  <div className="bg-navy/5 rounded-xl px-4 py-3">
                    <p className="text-sm text-navy font-body">{m.cuerpo}</p>
                    <p className="text-xs text-navy/40 font-body mt-1 tabular-nums">
                      {new Date(m.created_at).toLocaleDateString('es-AR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                      })}
                    </p>
                  </div>
                  {m.respuesta && (
                    <div className="ml-4 bg-orange/10 rounded-xl px-4 py-3">
                      <p className="text-xs font-semibold text-orange font-body mb-0.5">Respuesta del profe</p>
                      <p className="text-sm text-navy font-body">{m.respuesta}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {(config?.facebook_url || config?.instagram_url || config?.instagram_suplementos_url) && (
          <div className="bg-white rounded-2xl shadow-sm px-5 py-5">
            <p className="text-xs font-body font-semibold tracking-widest text-orange uppercase mb-3">
              Seguínos
            </p>
            <div className="flex flex-col gap-2">
              {config.facebook_url && (
                <a
                  href={config.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-navy font-body font-medium hover:text-orange transition-colors text-sm"
                >
                  <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">f</span>
                  Facebook
                </a>
              )}
              {config.instagram_url && (
                <a
                  href={config.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-navy font-body font-medium hover:text-orange transition-colors text-sm"
                >
                  <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-orange flex items-center justify-center text-white text-xs font-bold shrink-0">ig</span>
                  Instagram
                </a>
              )}
              {config.instagram_suplementos_url && (
                <a
                  href={config.instagram_suplementos_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-navy font-body font-medium hover:text-orange transition-colors text-sm"
                >
                  <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-orange flex items-center justify-center text-white text-xs font-bold shrink-0">ig</span>
                  Instagram suplementos
                </a>
              )}
            </div>
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  )
}
