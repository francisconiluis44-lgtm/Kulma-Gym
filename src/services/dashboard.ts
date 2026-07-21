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
      .select('id')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha_vencimiento', hoy),
    supabase.from('asistencias')
      .select('alumno_id')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha', hace14d),
    supabase.from('cobros')
      .select('monto')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha', primerDiaMes)
      .neq('estado', 'anulado'),
  ])

  const asistieronIds = new Set((asist14d ?? []).map(a => a.alumno_id))
  const inactivos = (alumnosActivos ?? []).filter(a => !asistieronIds.has(a.id)).length
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
    ingresosMesActual: totalMes,
    ingresosMesFormateado: `$${totalMes.toLocaleString('es-AR')}`,
    prioridades,
    sinAlertas: prioridades.length === 0,
  }
}
