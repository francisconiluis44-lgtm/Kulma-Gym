import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { signOut } from '@/app/actions'
import ComentarioForm from './ComentarioForm'
import MensajeForm from './MensajeForm'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const adminSupabase = createAdminClient()

  const [{ data: alumno }, { data: comunicados }] = await Promise.all([
    adminSupabase.from('alumnos').select('*').eq('id', user.id).single(),
    adminSupabase
      .from('comunicados')
      .select(
        'id, titulo, cuerpo, created_at, comentarios(id, cuerpo, created_at, alumno_id, alumnos(nombre_completo))'
      )
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const firstName = alumno?.nombre_completo?.split(' ')[0] ?? 'Alumno'

  const venc = alumno?.fecha_vencimiento
    ? new Date(alumno.fecha_vencimiento + 'T00:00:00')
    : null
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const diasRestantes = venc
    ? Math.ceil((venc.getTime() - hoy.getTime()) / 86400000)
    : null

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-navy text-white px-4 py-4 shadow-md">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs font-body text-orange font-semibold tracking-widest uppercase">
              Mi gym
            </p>
            <h1 className="text-xl font-heading font-extrabold leading-tight">
              KULMA GYM
            </h1>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm font-body text-white/70 hover:text-white transition-colors"
            >
              Salir
            </button>
          </form>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Welcome */}
        <div className="bg-white rounded-2xl shadow-sm px-5 py-5">
          <p className="text-sm text-navy/50 font-body">Bienvenido/a,</p>
          <h2 className="text-2xl font-heading font-extrabold text-navy mt-0.5">
            {firstName} 👋
          </h2>
        </div>

        {/* Rutina */}
        <div className="bg-white rounded-2xl shadow-sm px-5 py-5">
          <p className="text-xs font-body font-semibold tracking-widest text-orange uppercase mb-1">
            Tu rutina
          </p>
          {alumno?.rutina_url ? (
            <a
              href={alumno.rutina_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-1 text-navy font-semibold font-body hover:text-orange transition-colors"
            >
              <span>Ver mi rutina en Google Drive</span>
              <span className="text-lg">↗</span>
            </a>
          ) : (
            <p className="text-navy/40 font-body text-sm mt-1">
              Tu profe todavía no cargó tu rutina.
            </p>
          )}
        </div>

        {/* Membresía */}
        <div className="bg-white rounded-2xl shadow-sm px-5 py-5">
          <p className="text-xs font-body font-semibold tracking-widest text-orange uppercase mb-1">
            Membresía
          </p>
          {venc ? (
            <div className="mt-1">
              <p className="text-navy/60 font-body text-sm">
                Vence el{' '}
                <span className="font-semibold text-navy">
                  {venc.toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </p>
              <p
                className={`text-lg font-heading font-bold mt-0.5 ${
                  diasRestantes !== null && diasRestantes < 0
                    ? 'text-red-500'
                    : diasRestantes !== null && diasRestantes <= 7
                      ? 'text-orange'
                      : 'text-navy'
                }`}
              >
                {diasRestantes === null
                  ? ''
                  : diasRestantes < 0
                    ? 'Membresía vencida'
                    : diasRestantes === 0
                      ? 'Vence hoy'
                      : `${diasRestantes} día${diasRestantes !== 1 ? 's' : ''} restante${diasRestantes !== 1 ? 's' : ''}`}
              </p>
            </div>
          ) : (
            <p className="text-navy/40 font-body text-sm mt-1">
              Sin fecha de vencimiento registrada.
            </p>
          )}
        </div>

        {/* Comunicados */}
        <div>
          <h3 className="text-lg font-heading font-bold text-navy mb-3 px-1">
            Comunicados
          </h3>
          {!comunicados || comunicados.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm px-5 py-8 text-center">
              <p className="text-navy/40 font-body text-sm">
                No hay comunicados todavía.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {comunicados.map((c) => {
                const comentariosArr = Array.isArray(c.comentarios)
                  ? c.comentarios
                  : []
                return (
                  <div key={c.id} className="bg-white rounded-2xl shadow-sm px-5 py-5">
                    <p className="text-xs text-navy/40 font-body mb-1 tabular-nums">
                      {new Date(c.created_at).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </p>
                    <h4 className="font-heading font-semibold text-navy mb-1">
                      {c.titulo}
                    </h4>
                    <p className="text-sm text-navy/70 font-body whitespace-pre-wrap">
                      {c.cuerpo}
                    </p>

                    {comentariosArr.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                        {comentariosArr.map((cm) => {
                          const cmAlumno = Array.isArray(cm.alumnos)
                            ? cm.alumnos[0]
                            : cm.alumnos
                          return (
                            <div key={cm.id} className="flex gap-2">
                              <div className="w-6 h-6 rounded-full bg-orange/20 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-orange">
                                  {(cmAlumno?.nombre_completo ?? 'A')[0]}
                                </span>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-navy font-body">
                                  {cmAlumno?.nombre_completo?.split(' ')[0] ??
                                    'Alumno'}
                                </p>
                                <p className="text-sm text-navy/70 font-body">
                                  {cm.cuerpo}
                                </p>
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

        {/* Mensaje al profe */}
        <MensajeForm />

        <div className="h-4" />
      </div>
    </div>
  )
}
