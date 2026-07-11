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
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          {(gym.logo_header_url || gym.logo_url) ? (
            <img
              src={gym.logo_header_url ?? gym.logo_url!}
              alt={gym.nombre}
              className="h-16 object-contain mx-auto mb-3"
            />
          ) : (
            <h1 className="text-2xl font-heading font-extrabold text-navy mb-1">{gym.nombre}</h1>
          )}
          <p className="text-navy/50 font-body text-sm">Registro de asistencia</p>
        </div>

        {!alumno ? (
          <div className="bg-white rounded-2xl shadow-sm px-6 py-8 text-center">
            <p className="text-navy font-body text-sm">
              No estás registrado como alumno de este gimnasio.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm px-6 py-8 text-center">
            <p className="text-sm text-navy/50 font-body mb-1">Hola,</p>
            <p className="text-2xl font-heading font-extrabold text-navy mb-6">
              {alumno.nombre_completo.split(' ')[0]} 👋
            </p>
            <CheckinButton
              yaRegistrado={asistenciaHoy !== null}
              hora={asistenciaHoy?.checked_in_at ?? null}
            />
          </div>
        )}

        <p className="text-center text-xs text-navy/40 font-body mt-4 capitalize tabular-nums">
          {fechaLabel}
        </p>
      </div>
    </div>
  )
}
