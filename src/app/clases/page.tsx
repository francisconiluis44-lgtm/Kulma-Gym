import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getGymContext } from '@/lib/gym-context'
import ReservarBtn from './ReservarBtn'

export const dynamic = 'force-dynamic'

export default async function ClasesAlumnoPage() {
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

  const ahoraUTC = new Date().toISOString()

  const [{ data: clases }, { data: misReservas }] = await Promise.all([
    adminSupabase
      .from('clases')
      .select('*')
      .eq('gimnasio_id', gym.id)
      .gte('fecha_hora', ahoraUTC)
      .order('fecha_hora')
      .limit(50),
    alumno
      ? adminSupabase
          .from('reservas')
          .select('clase_id, estado')
          .eq('alumno_id', alumno.id)
          .eq('estado', 'confirmada')
      : Promise.resolve({ data: [] }),
  ])

  const reservadasSet = new Set((misReservas ?? []).map(r => r.clase_id))

  const { data: conteos } = await adminSupabase
    .from('reservas')
    .select('clase_id')
    .eq('gimnasio_id', gym.id)
    .eq('estado', 'confirmada')
    .in('clase_id', (clases ?? []).map(c => c.id))

  const ocupadosMap: Record<string, number> = {}
  for (const r of conteos ?? []) {
    ocupadosMap[r.clase_id] = (ocupadosMap[r.clase_id] ?? 0) + 1
  }

  const hoyAR = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
  const grupos: Record<string, typeof clases> = {}
  for (const c of clases ?? []) {
    const fecha = new Date(c.fecha_hora).toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
    if (!grupos[fecha]) grupos[fecha] = []
    grupos[fecha]!.push(c)
  }
  const fechasOrdenadas = Object.keys(grupos).sort()

  function labelFecha(fechaStr: string): string {
    if (fechaStr === hoyAR) return 'Hoy'
    const mañana = new Date(hoyAR + 'T00:00:00-03:00')
    mañana.setDate(mañana.getDate() + 1)
    if (fechaStr === mañana.toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })) return 'Mañana'
    return new Date(fechaStr + 'T12:00:00Z').toLocaleDateString('es-AR', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-sm mx-auto px-4 py-8 space-y-6">
        <div className="text-center">
          {(gym.logo_header_url || gym.logo_url) ? (
            <img src={gym.logo_header_url ?? gym.logo_url!} alt={gym.nombre} className="h-12 object-contain mx-auto mb-3" />
          ) : (
            <h1 className="text-xl font-heading font-extrabold text-navy mb-1">{gym.nombre}</h1>
          )}
          <p className="text-navy/50 font-body text-sm">Clases y turnos</p>
          {alumno && (
            <p className="text-navy/30 font-body text-xs mt-0.5">Hola, {alumno.nombre_completo.split(' ')[0]}</p>
          )}
        </div>

        {!alumno ? (
          <div className="bg-white rounded-2xl shadow-sm px-6 py-8 text-center">
            <p className="text-navy font-body text-sm">No estás registrado como alumno de este gimnasio.</p>
          </div>
        ) : fechasOrdenadas.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm px-6 py-8 text-center">
            <p className="text-navy/40 font-body text-sm">No hay clases programadas por el momento.</p>
          </div>
        ) : (
          fechasOrdenadas.map(fecha => (
            <div key={fecha}>
              <p className="text-xs font-body font-semibold tracking-widest text-navy/50 uppercase mb-2 capitalize">
                {labelFecha(fecha)}
              </p>
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {(grupos[fecha] ?? []).map((clase, i) => {
                  const ocupados = ocupadosMap[clase.id] ?? 0
                  const reservada = reservadasSet.has(clase.id)
                  const sinCupo = !reservada && ocupados >= clase.capacidad_max
                  const hora = new Date(clase.fecha_hora).toLocaleTimeString('es-AR', {
                    timeZone: 'America/Argentina/Buenos_Aires',
                    hour: '2-digit', minute: '2-digit',
                  })

                  return (
                    <div
                      key={clase.id}
                      className={`flex items-center gap-3 px-4 py-4 ${i > 0 ? 'border-t border-gray-100' : ''}`}
                    >
                      <div className="flex-shrink-0 text-center w-12">
                        <p className="text-sm font-heading font-extrabold text-navy tabular-nums">{hora}</p>
                        <p className="text-xs font-body text-navy/40">{clase.duracion_min}′</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body font-semibold text-sm text-navy">{clase.titulo}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {clase.instructor && (
                            <span className="text-xs font-body text-navy/50">{clase.instructor}</span>
                          )}
                          {!clase.cancelada && (
                            <span className="text-xs font-body text-navy/30">
                              {ocupados}/{clase.capacidad_max} lugares
                            </span>
                          )}
                          {reservada && !clase.cancelada && (
                            <span className="text-xs font-body font-semibold text-green-600">✓ Reservado</span>
                          )}
                        </div>
                        {clase.descripcion && (
                          <p className="text-xs font-body text-navy/40 mt-0.5 line-clamp-2">{clase.descripcion}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <ReservarBtn
                          claseId={clase.id}
                          reservada={reservada}
                          sinCupo={sinCupo}
                          cancelada={clase.cancelada}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
