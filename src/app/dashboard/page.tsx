import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { signOut } from '@/app/actions'
import Link from 'next/link'
import ComentarioForm from './ComentarioForm'
import MensajeForm from './MensajeForm'
import InstallPwa from '@/app/InstallPwa'
import NotificacionesBtn from './NotificacionesBtn'
import SolicitarRutinaBtn from './SolicitarRutinaBtn'
import { getGymContext } from '@/lib/gym-context'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const gym = await getGymContext()
  const adminSupabase = createAdminClient()

  const hoyAR = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
  const hoyDate = new Date(hoyAR + 'T00:00:00')
  const diaSemana = hoyDate.getDay()
  const diasDesdeElLunes = diaSemana === 0 ? 6 : diaSemana - 1
  const lunesDate = new Date(hoyDate)
  lunesDate.setDate(hoyDate.getDate() - diasDesdeElLunes)
  const lunesStr = lunesDate.toISOString().split('T')[0]

  const [
    { data: alumno },
    { data: comunicados },
    { data: misMensajes },
    { data: mensajesDelProfe },
    { data: config },
    { data: asistencias },
  ] = await Promise.all([
    adminSupabase.from('alumnos').select('*').eq('id', user.id).single(),
    adminSupabase
      .from('comunicados')
      .select('id, titulo, cuerpo, created_at, comentarios(id, cuerpo, created_at, alumno_id, alumnos(nombre_completo))')
      .eq('gimnasio_id', gym.id)
      .order('created_at', { ascending: false })
      .limit(3),
    adminSupabase
      .from('mensajes')
      .select('id, cuerpo, created_at, respuesta, respondido_at')
      .eq('alumno_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    adminSupabase
      .from('mensajes_admin')
      .select('id, cuerpo, created_at, leido')
      .eq('alumno_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    adminSupabase.from('configuracion').select('*').eq('gimnasio_id', gym.id).maybeSingle(),
    adminSupabase
      .from('asistencias')
      .select('fecha, checked_in_at')
      .eq('alumno_id', user.id)
      .eq('gimnasio_id', gym.id)
      .order('fecha', { ascending: false })
      .limit(30),
  ])

  // Mark admin messages as read (capture unread before update for novedades)
  const unread = (mensajesDelProfe ?? []).filter((m) => !m.leido).map((m) => m.id)
  if (unread.length > 0) {
    await adminSupabase.from('mensajes_admin').update({ leido: true }).in('id', unread)
  }

  // ─── Novedades (últimos 7 días) ───────────────────────
  const hace7dDate = new Date(hoyDate)
  hace7dDate.setDate(hoyDate.getDate() - 7)
  const hace7d = hace7dDate.toISOString().split('T')[0]

  const novedades: { icon: string; text: string }[] = []
  const comunicadosNuevos = (comunicados ?? []).filter(c => c.created_at.slice(0, 10) >= hace7d)
  if (comunicadosNuevos.length > 0)
    novedades.push({ icon: '📢', text: comunicadosNuevos.length === 1 ? 'Hay un comunicado nuevo' : `Hay ${comunicadosNuevos.length} comunicados nuevos` })
  if (unread.length > 0)
    novedades.push({ icon: '📩', text: unread.length === 1 ? 'Tu profe te escribió' : `Tu profe te envió ${unread.length} mensajes` })
  const respuestasNuevas = (misMensajes ?? []).filter(m => m.respuesta && m.respondido_at && m.respondido_at.slice(0, 10) >= hace7d)
  if (respuestasNuevas.length > 0)
    novedades.push({ icon: '💬', text: 'Tu profe respondió tu mensaje' })

  // ─── Historial de asistencias ─────────────────────────
  const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const ayerDate = new Date(hoyDate)
  ayerDate.setDate(hoyDate.getDate() - 1)
  const ayerStr = ayerDate.toISOString().split('T')[0]

  function fmtAsistencia(a: { fecha: string; checked_in_at: string }): { dia: string; hora: string } {
    const hora = new Date(a.checked_in_at).toLocaleTimeString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      hour: '2-digit', minute: '2-digit', hour12: false,
    })
    if (a.fecha === hoyAR) return { dia: 'Hoy', hora }
    if (a.fecha === ayerStr) return { dia: 'Ayer', hora }
    const d = new Date(a.fecha + 'T12:00:00Z')
    return { dia: DIAS_CORTOS[d.getUTCDay()], hora }
  }

  const historialAsistencias = (asistencias ?? []).slice(0, 5).map(fmtAsistencia)

  const firstName = alumno?.nombre_completo?.split(' ')[0] ?? 'Alumno'

  // Smart greeting based on attendance
  const ultimaAsistencia = asistencias?.[0]?.fecha ?? null
  const asistenciasEstaSemana = (asistencias ?? []).filter((a) => a.fecha >= lunesStr).length

  function buildGreeting(): string {
    if (!ultimaAsistencia) return '¡Te esperamos para tu primer entrenamiento! 💪'
    if (ultimaAsistencia === hoyAR) {
      return asistenciasEstaSemana > 1
        ? `¡Ya entrenaste ${asistenciasEstaSemana} veces esta semana! 🔥`
        : '¡Ya entrenaste hoy! Seguí así 💪'
    }
    if (asistenciasEstaSemana > 0) {
      return `Esta semana entrenaste ${asistenciasEstaSemana} ${asistenciasEstaSemana === 1 ? 'vez' : 'veces'} 💪`
    }
    const diasSin = Math.ceil(
      (hoyDate.getTime() - new Date(ultimaAsistencia + 'T00:00:00').getTime()) / 86400000
    )
    if (diasSin === 1) return 'Última asistencia: ayer ✅'
    return `Hace ${diasSin} días que no entrenás 💪`
  }

  const saludoContextual = buildGreeting()

  // Membership dates
  function calcDias(fecha: string | null) {
    if (!fecha) return null
    const d = new Date(fecha + 'T00:00:00')
    return Math.ceil((d.getTime() - hoyDate.getTime()) / 86400000)
  }

  const diasMembresia = calcDias(alumno?.fecha_vencimiento ?? null)
  const diasRutina = calcDias(alumno?.rutina_fecha_vencimiento ?? null)

  function diasLabel(dias: number | null) {
    if (dias === null) return null
    if (dias < 0) return { text: 'Vencida', cn: 'text-red-500' }
    if (dias === 0) return { text: 'Vence hoy', cn: 'text-orange' }
    return {
      text: `${dias} día${dias !== 1 ? 's' : ''} restante${dias !== 1 ? 's' : ''}`,
      cn: dias <= 7 ? 'text-orange' : 'text-navy',
    }
  }

  const labelMembresia = diasLabel(diasMembresia)
  const labelRutina = diasLabel(diasRutina)

  // Membership progress bar (assumes 30-day period)
  const barFill = alumno?.fecha_vencimiento
    ? Math.max(0, Math.min(100, ((30 - (diasMembresia ?? 0)) / 30) * 100))
    : 0
  const barColor =
    !diasMembresia || diasMembresia <= 0
      ? 'bg-red-500'
      : diasMembresia <= 7
      ? 'bg-red-400'
      : diasMembresia <= 15
      ? 'bg-orange'
      : 'bg-green-500'

  const membresiaCritica = diasMembresia !== null && diasMembresia <= 7 && diasMembresia > 0

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-navy text-white px-4 py-4 shadow-md">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs font-body text-white/60 font-semibold tracking-widest uppercase mb-1">Tu mejor versión empieza hoy</p>
            {(gym.logo_header_url || gym.logo_url) ? (
              <div className="bg-white rounded-lg px-2 py-1 inline-block">
                <img
                  src={gym.logo_header_url ?? gym.logo_url!}
                  alt={gym.nombre}
                  className="h-14 object-contain"
                />
              </div>
            ) : (
              <p className="text-xl font-heading font-extrabold text-white">{gym.nombre}</p>
            )}
          </div>
          <form action={signOut}>
            <button type="submit" className="text-sm font-body text-white/70 hover:text-white transition-colors">
              Salir
            </button>
          </form>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <InstallPwa gymNombre={gym.nombre} />
        <NotificacionesBtn userId={user.id} />

        {/* Welcome */}
        <div className="bg-white rounded-2xl shadow-sm px-5 py-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-navy/50 font-body">Bienvenido/a,</p>
            <h2 className="text-2xl font-heading font-extrabold text-navy mt-0.5">{firstName} 👋</h2>
            <p className="text-sm text-navy/60 font-body mt-1.5 leading-snug">{saludoContextual}</p>
          </div>
          <Link
            href="/perfil"
            className="text-xs font-body font-semibold text-orange hover:underline shrink-0 mt-1"
          >
            Mi perfil →
          </Link>
        </div>

        {/* Novedades */}
        {novedades.length > 0 && (
          <div className="bg-navy rounded-2xl px-5 py-4">
            <p className="text-xs font-body font-semibold tracking-widest text-white/50 uppercase mb-3">
              Novedades
            </p>
            <ul className="space-y-2">
              {novedades.map((n) => (
                <li key={n.text} className="flex items-center gap-3 text-sm font-body text-white">
                  <span className="text-base leading-none">{n.icon}</span>
                  <span>{n.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Check-in */}
        <Link
          href="/checkin"
          className="flex items-center justify-between bg-navy text-white rounded-2xl shadow-sm px-5 py-4 transition-all active:scale-[0.98]"
        >
          <div>
            <p className="text-xs font-body text-white/60 uppercase tracking-widest mb-0.5">Estoy en el gym</p>
            <p className="font-heading font-bold text-lg">Registrar asistencia →</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </Link>

        {/* Membresía */}
        <div className={`rounded-2xl shadow-sm px-5 py-5 ${membresiaCritica ? 'bg-orange/10 border border-orange/30' : 'bg-white'}`}>
          <p className="text-xs font-body font-semibold tracking-widest text-orange uppercase mb-2">Membresía</p>
          {alumno?.fecha_vencimiento ? (
            <>
              {/* Progress bar */}
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-all ${barColor}`}
                  style={{ width: `${barFill}%` }}
                />
              </div>
              <div className="flex items-baseline justify-between gap-2">
                {labelMembresia && (
                  <p className={`text-lg font-heading font-bold ${labelMembresia.cn}`}>
                    {labelMembresia.text}
                  </p>
                )}
                <p className="text-xs text-navy/40 font-body tabular-nums shrink-0">
                  {new Date(alumno.fecha_vencimiento + 'T00:00:00').toLocaleDateString('es-AR', {
                    day: '2-digit', month: 'long',
                  })}
                </p>
              </div>
              {membresiaCritica && (
                <p className="mt-2 text-sm font-semibold text-orange font-body">
                  Pasate por el gimnasio o contactá a tu profe para renovar.
                </p>
              )}
            </>
          ) : (
            <p className="text-navy/40 font-body text-sm">Sin fecha de vencimiento registrada.</p>
          )}
        </div>

        {/* Rutina */}
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
          {diasRutina !== null && diasRutina < 0 && (
            <SolicitarRutinaBtn />
          )}
        </div>

        {/* Historial de asistencias */}
        {historialAsistencias.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm px-5 py-5">
            <p className="text-xs font-body font-semibold tracking-widest text-orange uppercase mb-3">
              Tus últimas asistencias
            </p>
            <ul className="space-y-2.5">
              {historialAsistencias.map((a, i) => (
                <li key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base leading-none">✅</span>
                    <span className="text-sm font-body font-medium text-navy">{a.dia}</span>
                  </div>
                  <span className="text-sm font-body text-navy/40 tabular-nums">{a.hora}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Mensajes del profe */}
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

        {/* Comunicados */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-lg font-heading font-bold text-navy">Comunicados</h3>
            {comunicados && comunicados.length > 1 && (
              <a href="#todos-comunicados" className="text-xs font-body font-semibold text-orange hover:underline">
                Ver todos ({comunicados.length}) ↓
              </a>
            )}
          </div>

          {!comunicados || comunicados.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm px-5 py-8 text-center">
              <p className="text-3xl mb-2">📢</p>
              <p className="text-navy/40 font-body text-sm">No hay novedades por ahora.</p>
            </div>
          ) : (() => {
            const [ultimo, ...resto] = comunicados
            const comentariosUltimo = Array.isArray(ultimo.comentarios) ? ultimo.comentarios : []
            return (
              <div className="space-y-4">
                {/* Último comunicado destacado */}
                <div className="bg-white rounded-2xl shadow-sm px-5 py-5 border-l-4 border-orange">
                  <p className="text-xs text-navy/40 font-body mb-1 tabular-nums">
                    {new Date(ultimo.created_at).toLocaleDateString('es-AR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                    })}
                  </p>
                  <h4 className="font-heading font-semibold text-navy mb-1">{ultimo.titulo}</h4>
                  <p className="text-sm text-navy/70 font-body whitespace-pre-wrap">{ultimo.cuerpo}</p>
                  {comentariosUltimo.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                      {comentariosUltimo.map((cm) => {
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
                  <ComentarioForm comunicadoId={ultimo.id} />
                </div>

                {/* Resto de comunicados */}
                {resto.length > 0 && (
                  <div id="todos-comunicados" className="space-y-4">
                    {resto.map((c) => {
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
            )
          })()}
        </div>

        {/* Mis mensajes + respuestas */}
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

        {/* Redes sociales */}
        {(config?.facebook_url || config?.instagram_url || config?.instagram_suplementos_url) && (
          <div className="bg-white rounded-2xl shadow-sm px-5 py-5">
            <p className="text-xs font-body font-semibold tracking-widest text-orange uppercase mb-3">
              Seguinos
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
                  Link secundario
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
