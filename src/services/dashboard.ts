import { createAdminClient } from '@/lib/supabase/admin'

function hoyAR(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export async function getPrioridadesDelDia(gimnasioId: string) {
  const supabase = createAdminClient()
  const hoy = hoyAR()
  const en7d = addDays(hoy, 7)
  const hace14d = addDays(hoy, -14)
  const primerDiaMes = hoy.slice(0, 7) + '-01'

  const [
    { count: membresiasVencidas },
    { count: membresiasPorVencer },
    { data: alumnosActivos },
    { data: asist14d },
    { data: ultimasAsistencias },
    { data: cobros },
  ] = await Promise.all([
    supabase.from('alumnos')
      .select('*', { count: 'exact', head: true })
      .eq('gimnasio_id', gimnasioId)
      .not('fecha_vencimiento', 'is', null)
      .lt('fecha_vencimiento', hoy),
    supabase.from('alumnos')
      .select('*', { count: 'exact', head: true })
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha_vencimiento', hoy)
      .lte('fecha_vencimiento', en7d),
    supabase.from('alumnos')
      .select('id, nombre_completo')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha_vencimiento', hoy),
    supabase.from('asistencias')
      .select('alumno_id')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha', hace14d),
    supabase.from('asistencias')
      .select('alumno_id, fecha')
      .eq('gimnasio_id', gimnasioId)
      .order('fecha', { ascending: false })
      .limit(2000),
    supabase.from('cobros')
      .select('monto')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha', primerDiaMes)
      .neq('estado', 'anulado'),
  ])

  const hoyDate = new Date(hoy + 'T00:00:00')
  const asistieronIds = new Set((asist14d ?? []).map(a => a.alumno_id))
  const ultimaAsist = new Map<string, string>()
  for (const a of ultimasAsistencias ?? []) {
    if (!ultimaAsist.has(a.alumno_id)) ultimaAsist.set(a.alumno_id, a.fecha)
  }

  const inactivosDetalle = (alumnosActivos ?? [])
    .filter(a => !asistieronIds.has(a.id))
    .map(a => {
      const ultima = ultimaAsist.get(a.id) ?? null
      const dias = ultima
        ? Math.ceil((hoyDate.getTime() - new Date(ultima + 'T00:00:00').getTime()) / 86400000)
        : null
      return { nombre: a.nombre_completo, diasSinAsistir: dias, ultimaAsistencia: ultima ?? 'sin registros' }
    })
    .sort((a, b) => (b.diasSinAsistir ?? 9999) - (a.diasSinAsistir ?? 9999))

  const inactivos = inactivosDetalle.length
  const topInactivos = inactivosDetalle.slice(0, 5).map(a => ({
    nombre: a.nombre,
    diasSinAsistirLabel: a.diasSinAsistir
      ? `${a.diasSinAsistir} día${a.diasSinAsistir !== 1 ? 's' : ''} sin asistir`
      : 'Sin registros de asistencia',
  }))
  const totalMes = (cobros ?? []).reduce((s, c) => s + c.monto, 0)

  const prioridades: string[] = []
  const mv = membresiasVencidas ?? 0
  const mpv = membresiasPorVencer ?? 0
  if (mv > 0) prioridades.push(`${mv} membresía${mv !== 1 ? 's' : ''} vencida${mv !== 1 ? 's' : ''} para cobrar`)
  if (mpv > 0) prioridades.push(`${mpv} membresía${mpv !== 1 ? 's' : ''} por vencer esta semana`)
  if (inactivos > 0) prioridades.push(`${inactivos} alumno${inactivos !== 1 ? 's' : ''} con membresía activa sin asistir en 14 días`)

  return {
    fecha: hoy,
    membresiasVencidas: mv,
    membresiasPorVencer: mpv,
    alumnosInactivos14d: inactivos,
    topInactivos,
    ingresosMesActual: totalMes,
    ingresosMesFormateado: `$${totalMes.toLocaleString('es-AR')}`,
    prioridades,
    sinAlertas: prioridades.length === 0,
  }
}
