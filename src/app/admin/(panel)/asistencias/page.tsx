import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSession } from '@/lib/admin-auth'
import { getGymContext } from '@/lib/gym-context'
import { studentEmailDomain } from '@/lib/gym-context'
import QrCode from './QrCode'
import ManualCheckin from './ManualCheckin'

export const dynamic = 'force-dynamic'

export default async function AsistenciasPage() {
  const { gimnasioId } = await getAdminSession()
  const gym = await getGymContext()
  const adminSupabase = createAdminClient()

  const hoyAR = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })

  const [{ data: asistenciasHoy }, { data: alumnos }] = await Promise.all([
    adminSupabase
      .from('asistencias')
      .select('id, checked_in_at, tipo, alumno_id')
      .eq('gimnasio_id', gimnasioId)
      .eq('fecha', hoyAR)
      .order('checked_in_at', { ascending: false }),
    adminSupabase
      .from('alumnos')
      .select('id, nombre_completo')
      .eq('gimnasio_id', gimnasioId)
      .order('nombre_completo'),
  ])

  const alumnoMap = new Map((alumnos ?? []).map((a) => [a.id, a.nombre_completo]))

  const checkinUrl = `https://${studentEmailDomain(gym.slug)}/checkin`

  const fechaLabel = new Date().toLocaleDateString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h2 className="text-2xl font-heading font-extrabold text-navy">Asistencias</h2>
        <p className="text-sm text-navy/50 font-body capitalize">{fechaLabel}</p>
      </div>

      {/* QR Code */}
      <div className="bg-white rounded-2xl shadow-sm px-6 py-6">
        <p className="text-xs font-body font-semibold tracking-widest text-orange uppercase mb-4">
          Código QR del gimnasio
        </p>
        <p className="text-sm text-navy/60 font-body mb-4">
          Mostrale este QR a los alumnos para que registren su asistencia desde el celular.
        </p>
        <QrCode url={checkinUrl} />
      </div>

      {/* Manual check-in */}
      <div className="bg-white rounded-2xl shadow-sm px-6 py-6">
        <p className="text-xs font-body font-semibold tracking-widest text-orange uppercase mb-4">
          Registrar manualmente
        </p>
        <p className="text-sm text-navy/60 font-body mb-4">
          Para alumnos que no tienen el celular a mano.
        </p>
        <ManualCheckin alumnos={alumnos ?? []} />
      </div>

      {/* Today's attendance */}
      <div className="bg-white rounded-2xl shadow-sm px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-body font-semibold tracking-widest text-orange uppercase">
            Presentes hoy
          </p>
          <span className="text-2xl font-heading font-extrabold text-navy">
            {asistenciasHoy?.length ?? 0}
          </span>
        </div>

        {!asistenciasHoy || asistenciasHoy.length === 0 ? (
          <p className="text-navy/40 font-body text-sm">Nadie registró asistencia todavía.</p>
        ) : (
          <ul className="space-y-2">
            {asistenciasHoy.map((a) => {
              const nombre = alumnoMap.get(a.alumno_id) ?? '—'
              const hora = new Date(a.checked_in_at).toLocaleTimeString('es-AR', {
                timeZone: 'America/Argentina/Buenos_Aires',
                hour: '2-digit',
                minute: '2-digit',
              })
              return (
                <li key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="font-body text-sm text-navy">{nombre ?? '—'}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-navy/40 font-body tabular-nums">{hora} hs</span>
                    {a.tipo === 'admin' && (
                      <span className="text-xs font-body bg-navy/10 text-navy/60 px-2 py-0.5 rounded-full">
                        manual
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
