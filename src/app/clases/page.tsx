import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getGymContext } from '@/lib/gym-context'
import { addDays, getISODow, getTodayAR } from '@/app/admin/(panel)/clases/dateUtils'
import type { ClaseOcurrencia } from '@/app/admin/(panel)/clases/types'
import ReservarBtn from './ReservarBtn'

export const dynamic = 'force-dynamic'

type OcurrenciaAlumno = ClaseOcurrencia & { yaReservada: boolean }

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

  const hoy = getTodayAR()
  const hasta = addDays(hoy, 41)
  const mañana = addDays(hoy, 1)

  // Current time in Argentina to filter out past classes today
  const ahoraHora = new Date()
    .toLocaleTimeString('en-GB', {
      timeZone: 'America/Argentina/Buenos_Aires',
      hour: '2-digit', minute: '2-digit', hour12: false,
    })
    .slice(0, 5)

  const [
    { data: versiones },
    { data: excepciones },
    { data: todasReservas },
  ] = await Promise.all([
    adminSupabase
      .from('clases_versiones')
      .select(`
        id, serie_id, dia_semana, hora_inicio, duracion_minutos,
        cupo_maximo, instructor, descripcion, fecha_desde, fecha_hasta,
        clases_series!inner ( id, nombre, activa, gimnasio_id )
      `)
      .eq('clases_series.gimnasio_id', gym.id)
      .eq('clases_series.activa', true)
      .lte('fecha_desde', hasta)
      .or(`fecha_hasta.is.null,fecha_hasta.gte.${hoy}`),
    adminSupabase
      .from('clases_excepciones')
      .select('*')
      .eq('gimnasio_id', gym.id)
      .gte('fecha', hoy)
      .lte('fecha', hasta),
    adminSupabase
      .from('clases_reservas')
      .select('serie_id, excepcion_id, fecha_ocurrencia, alumno_id')
      .eq('gimnasio_id', gym.id)
      .eq('estado', 'confirmada')
      .gte('fecha_ocurrencia', hoy)
      .lte('fecha_ocurrencia', hasta),
  ])

  // Build count maps and student's reservation keys
  const cntSerie: Record<string, number> = {}
  const cntExcep: Record<string, number> = {}
  const misReservas = new Set<string>()

  for (const r of todasReservas ?? []) {
    if (r.excepcion_id) {
      cntExcep[r.excepcion_id] = (cntExcep[r.excepcion_id] ?? 0) + 1
      if (r.alumno_id === alumno?.id) misReservas.add(`ex:${r.excepcion_id}`)
    } else if (r.serie_id && r.fecha_ocurrencia) {
      const k = `${r.serie_id}|${r.fecha_ocurrencia}`
      cntSerie[k] = (cntSerie[k] ?? 0) + 1
      if (r.alumno_id === alumno?.id) misReservas.add(`s:${k}`)
    }
  }

  // Index exceptions
  type ExRow = NonNullable<typeof excepciones>[number]
  const excBySerieYFecha: Record<string, ExRow> = {}
  const excEspeciales: ExRow[] = []
  for (const ex of excepciones ?? []) {
    if (ex.tipo === 'clase_especial') {
      excEspeciales.push(ex)
    } else if (ex.serie_id) {
      excBySerieYFecha[`${ex.serie_id}|${ex.fecha}`] = ex
    }
  }

  // Build occurrences for the next 14 days
  const fechas = Array.from({ length: 42 }, (_, i) => addDays(hoy, i))
  const ocurrencias: OcurrenciaAlumno[] = []

  for (const fecha of fechas) {
    const dow = getISODow(fecha)
    const esHoy = fecha === hoy

    for (const v of versiones ?? []) {
      if (v.dia_semana !== dow) continue
      if (v.fecha_desde > fecha) continue
      if (v.fecha_hasta && v.fecha_hasta < fecha) continue

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const serieNombre = (v.clases_series as any).nombre as string
      const ex = excBySerieYFecha[`${v.serie_id}|${fecha}`]
      const hora_inicio = ex?.hora_inicio ?? v.hora_inicio

      if (esHoy && hora_inicio.slice(0, 5) < ahoraHora) continue

      if (ex?.tipo === 'cancelacion') {
        const confirmadas = cntExcep[ex.id] ?? cntSerie[`${v.serie_id}|${fecha}`] ?? 0
        const yaReservada = misReservas.has(`ex:${ex.id}`) || misReservas.has(`s:${v.serie_id}|${fecha}`)
        ocurrencias.push({
          serie_id: v.serie_id,
          excepcion_id: ex.id,
          version_id: v.id,
          dia_semana: v.dia_semana,
          fecha,
          nombre: serieNombre,
          hora_inicio: v.hora_inicio,
          duracion_minutos: v.duracion_minutos,
          cupo_maximo: v.cupo_maximo,
          instructor: v.instructor,
          descripcion: v.descripcion,
          cancelada: true,
          es_especial: false,
          confirmadas,
          yaReservada,
        })
      } else {
        const nombre = ex?.nombre ?? serieNombre
        const duracion_minutos = ex?.duracion_minutos ?? v.duracion_minutos
        const cupo_maximo = ex?.cupo_maximo ?? v.cupo_maximo
        const instructor = ex?.instructor ?? v.instructor
        const descripcion = ex?.descripcion ?? v.descripcion
        const confirmadas = ex ? (cntExcep[ex.id] ?? 0) : (cntSerie[`${v.serie_id}|${fecha}`] ?? 0)
        const yaReservada = ex
          ? misReservas.has(`ex:${ex.id}`)
          : misReservas.has(`s:${v.serie_id}|${fecha}`)

        ocurrencias.push({
          serie_id: v.serie_id,
          excepcion_id: ex?.id ?? null,
          version_id: v.id,
          dia_semana: v.dia_semana,
          fecha,
          nombre,
          hora_inicio,
          duracion_minutos,
          cupo_maximo,
          instructor,
          descripcion,
          cancelada: false,
          es_especial: false,
          confirmadas,
          yaReservada,
        })
      }
    }

    // Special classes
    for (const ex of excEspeciales) {
      if (ex.fecha !== fecha) continue
      const hora_inicio = ex.hora_inicio ?? '00:00'
      if (esHoy && hora_inicio.slice(0, 5) < ahoraHora) continue

      ocurrencias.push({
        serie_id: null,
        excepcion_id: ex.id,
        version_id: null,
        dia_semana: dow,
        fecha,
        nombre: ex.nombre ?? 'Clase especial',
        hora_inicio,
        duracion_minutos: ex.duracion_minutos ?? 60,
        cupo_maximo: ex.cupo_maximo ?? 0,
        instructor: ex.instructor ?? '',
        descripcion: ex.descripcion ?? null,
        cancelada: false,
        es_especial: true,
        confirmadas: cntExcep[ex.id] ?? 0,
        yaReservada: misReservas.has(`ex:${ex.id}`),
      })
    }
  }

  ocurrencias.sort((a, b) =>
    a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : a.hora_inicio.localeCompare(b.hora_inicio),
  )

  // Group by date
  const grupos: Record<string, OcurrenciaAlumno[]> = {}
  for (const oc of ocurrencias) {
    if (!grupos[oc.fecha]) grupos[oc.fecha] = []
    grupos[oc.fecha]!.push(oc)
  }
  const fechasConClases = Object.keys(grupos).sort()

  function labelFecha(fechaStr: string): string {
    if (fechaStr === hoy) return 'Hoy'
    if (fechaStr === mañana) return 'Mañana'
    return new Date(fechaStr + 'T12:00:00Z').toLocaleDateString('es-AR', {
      weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
    })
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-sm mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="text-center">
          {(gym.logo_header_url || gym.logo_url) ? (
            <img
              src={gym.logo_header_url ?? gym.logo_url!}
              alt={gym.nombre}
              className="h-12 object-contain mx-auto mb-3"
            />
          ) : (
            <h1 className="text-xl font-heading font-extrabold text-navy mb-1">{gym.nombre}</h1>
          )}
          <p className="text-navy/50 font-body text-sm">Clases y turnos</p>
          {alumno && (
            <p className="text-navy/30 font-body text-xs mt-0.5">
              Hola, {alumno.nombre_completo.split(' ')[0]}
            </p>
          )}
        </div>

        {!alumno ? (
          <div className="bg-white rounded-2xl shadow-sm px-6 py-8 text-center">
            <p className="text-navy font-body text-sm">No estás registrado como alumno de este gimnasio.</p>
          </div>
        ) : fechasConClases.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm px-6 py-8 text-center">
            <p className="text-navy/40 font-body text-sm">No hay clases programadas por el momento.</p>
          </div>
        ) : (
          fechasConClases.map(fecha => (
            <div key={fecha}>
              <p className="text-xs font-body font-semibold tracking-widest text-navy/50 uppercase mb-2 capitalize">
                {labelFecha(fecha)}
              </p>
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {(grupos[fecha] ?? []).map((oc, i) => {
                  const sinCupo = !oc.yaReservada && !oc.cancelada && oc.cupo_maximo > 0 && oc.confirmadas >= oc.cupo_maximo
                  const hora = oc.hora_inicio.slice(0, 5)
                  const key = oc.excepcion_id ?? `${oc.serie_id}|${oc.fecha}`

                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-3 px-4 py-4 ${i > 0 ? 'border-t border-gray-100' : ''}`}
                    >
                      <div className="flex-shrink-0 text-center w-12">
                        <p className="text-sm font-heading font-extrabold text-navy tabular-nums">{hora}</p>
                        <p className="text-xs font-body text-navy/40">{oc.duracion_minutos}′</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-body font-semibold text-sm text-navy">{oc.nombre}</p>
                          {oc.es_especial && (
                            <span className="text-xs font-body font-semibold text-orange bg-orange/10 px-1.5 py-0.5 rounded-full">
                              Especial
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {oc.instructor && (
                            <span className="text-xs font-body text-navy/50">{oc.instructor}</span>
                          )}
                          {!oc.cancelada && oc.cupo_maximo > 0 && (
                            <span className="text-xs font-body text-navy/30">
                              {oc.confirmadas}/{oc.cupo_maximo} lugares
                            </span>
                          )}
                          {oc.yaReservada && !oc.cancelada && (
                            <span className="text-xs font-body font-semibold text-green-600">✓ Reservado</span>
                          )}
                          {sinCupo && (
                            <span className="text-xs font-body text-red-400">Sin cupo</span>
                          )}
                        </div>
                        {oc.descripcion && (
                          <p className="text-xs font-body text-navy/40 mt-0.5 line-clamp-2">{oc.descripcion}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <ReservarBtn
                          serieId={oc.serie_id}
                          excepcionId={oc.excepcion_id}
                          fechaOcurrencia={oc.fecha}
                          cupoMaximo={oc.cupo_maximo}
                          confirmadas={oc.confirmadas}
                          yaReservada={oc.yaReservada}
                          cancelada={oc.cancelada}
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
