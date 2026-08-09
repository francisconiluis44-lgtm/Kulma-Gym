import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getGymContext } from '@/lib/gym-context'
import CheckinButton from './CheckinButton'

export const dynamic = 'force-dynamic'

export default async function CheckinPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const gym = await getGymContext()
  const adminSupabase = createAdminClient()

  const { data: alumno } = await adminSupabase
    .from('alumnos')
    .select('id, nombre_completo')
    .eq('id', user.id)
    .eq('gimnasio_id', gym.id)
    .single()

  const hoyAR = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })

  const { data: asistenciaHoy } = alumno
    ? await adminSupabase
        .from('asistencias')
        .select('checked_in_at')
        .eq('alumno_id', alumno.id)
        .eq('fecha', hoyAR)
        .maybeSingle()
    : { data: null }

  const fechaLabel = new Date().toLocaleDateString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="min-h-[100dvh] bg-navy flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Concentric rings — misma firma que el admin login */}
      <svg className="absolute inset-0 w-full h-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
        {[160, 280, 400, 540, 700].map((r, i) => (
          <circle
            key={r}
            cx="50%"
            cy="100%"
            r={r}
            fill="none"
            stroke="white"
            strokeWidth="0.75"
            opacity={0.06 - i * 0.008}
          />
        ))}
      </svg>

      {/* Orange glow desde abajo */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] rounded-full bg-orange/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[180px] h-[180px] rounded-full bg-orange/25 blur-[60px] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* ── Branding ── */}
        <div className="text-center mb-10 animate-fade-in" style={{ animationDelay: '0ms' }}>
          {(gym.logo_header_url || gym.logo_url) ? (
            <img
              src={gym.logo_header_url ?? gym.logo_url!}
              alt={gym.nombre}
              className="h-16 object-contain mx-auto mb-3"
            />
          ) : (
            <h1
              className="text-3xl font-heading font-black tracking-tight bg-clip-text text-transparent mb-1"
              style={{ backgroundImage: 'linear-gradient(175deg, #ffffff 30%, var(--color-orange) 100%)' }}
            >
              {gym.nombre.toUpperCase()}
            </h1>
          )}
          <p className="text-[10px] font-semibold tracking-[0.22em] text-orange/80 uppercase font-body">
            Registro de asistencia
          </p>
        </div>

        {/* ── Card ── */}
        {!alumno ? (
          <div
            className="rounded-2xl px-6 py-8 text-center animate-fade-in"
            style={{ animationDelay: '80ms', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <p className="text-white/60 font-body text-sm">
              No estás registrado como alumno de este gimnasio.
            </p>
          </div>
        ) : (
          <div
            className="rounded-2xl px-6 py-8 text-center animate-fade-in"
            style={{ animationDelay: '80ms', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <p className="text-sm text-white/45 font-body mb-1">Hola,</p>
            <p className="text-2xl font-heading font-extrabold text-white mb-8">
              {alumno.nombre_completo.split(' ')[0]}
            </p>
            <CheckinButton
              yaRegistrado={asistenciaHoy !== null}
              hora={asistenciaHoy?.checked_in_at ?? null}
            />
          </div>
        )}

        {/* ── Fecha ── */}
        <p className="text-center text-xs text-white/30 font-body mt-5 capitalize tabular-nums animate-fade-in" style={{ animationDelay: '160ms' }}>
          {fechaLabel}
        </p>
      </div>
    </div>
  )
}
