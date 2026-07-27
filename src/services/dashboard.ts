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
    { data: alumnosPorVencer },
    { data: alumnosActivos },
    { data: asist14d },
    { data: ultimasAsistencias },
    { data: cobros },
    { count: extVencidas },
    { data: extPorVencer },
    { data: extActivos },
    { data: asistExt14d },
    { data: ultimasAsistExt },
    { data: cobrosExt },
  ] = await Promise.all([
    supabase.from('alumnos')
      .select('*', { count: 'exact', head: true })
      .eq('gimnasio_id', gimnasioId)
      .not('fecha_vencimiento', 'is', null)
      .lt('fecha_vencimiento', hoy),
    supabase.from('alumnos')
      .select('id, nombre_completo, fecha_vencimiento')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha_vencimiento', hoy)
      .lte('fecha_vencimiento', en7d)
      .order('fecha_vencimiento', { ascending: true }),
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
    supabase.from('alumnos_externos')
      .select('*', { count: 'exact', head: true })
      .eq('gimnasio_id', gimnasioId)
      .is('alumno_id', null)
      .not('fecha_vencimiento', 'is', null)
      .lt('fecha_vencimiento', hoy),
    supabase.from('alumnos_externos')
      .select('id, nombre_completo, fecha_vencimiento')
      .eq('gimnasio_id', gimnasioId)
      .is('alumno_id', null)
      .not('fecha_vencimiento', 'is', null)
      .gte('fecha_vencimiento', hoy)
      .lte('fecha_vencimiento', en7d)
      .order('fecha_vencimiento', { ascending: true }),
    supabase.from('alumnos_externos')
      .select('id, nombre_completo')
      .eq('gimnasio_id', gimnasioId)
      .is('alumno_id', null)
      .gte('fecha_vencimiento', hoy),
    supabase.from('asistencias_externas')
      .select('alumno_externo_id')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha', hace14d),
    supabase.from('asistencias_externas')
      .select('alumno_externo_id, fecha')
      .eq('gimnasio_id', gimnasioId)
      .order('fecha', { ascending: false })
      .limit(2000),
    supabase.from('cobros_externos')
      .select('monto')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha', primerDiaMes)
      .neq('estado', 'anulado'),
  ])

  const hoyDate = new Date(hoy + 'T00:00:00')

  const mv = (membresiasVencidas ?? 0) + (extVencidas ?? 0)
  const mpv = (alumnosPorVencer?.length ?? 0) + (extPorVencer?.length ?? 0)

  const topPorVencer = [
    ...(alumnosPorVencer ?? []).map(a => ({
      nombre: a.nombre_completo,
      tipo: 'registrado',
      diasRestantes: Math.ceil((new Date(a.fecha_vencimiento! + 'T00:00:00').getTime() - hoyDate.getTime()) / 86400000),
    })),
    ...(extPorVencer ?? []).map(a => ({
      nombre: a.nombre_completo,
      tipo: 'externo',
      diasRestantes: Math.ceil((new Date(a.fecha_vencimiento! + 'T00:00:00').getTime() - hoyDate.getTime()) / 86400000),
    })),
  ]
    .sort((a, b) => a.diasRestantes - b.diasRestantes)
    .map(a => ({
      nombre: a.nombre,
      tipo: a.tipo,
      diasRestantes: a.diasRestantes,
      diasRestantesLabel: a.diasRestantes === 0 ? 'Vence hoy' : `Vence en ${a.diasRestantes} día${a.diasRestantes !== 1 ? 's' : ''}`,
    }))

  const asistieronIds = new Set((asist14d ?? []).map(a => a.alumno_id))
  const ultimaAsist = new Map<string, string>()
  for (const a of ultimasAsistencias ?? []) {
    if (!ultimaAsist.has(a.alumno_id)) ultimaAsist.set(a.alumno_id, a.fecha)
  }

  const asistExtIds = new Set((asistExt14d ?? []).map(a => a.alumno_externo_id))
  const ultimaAsistExt = new Map<string, string>()
  for (const a of ultimasAsistExt ?? []) {
    if (!ultimaAsistExt.has(a.alumno_externo_id)) ultimaAsistExt.set(a.alumno_externo_id, a.fecha)
  }

  const inactivosRegDetalle = (alumnosActivos ?? [])
    .filter(a => !asistieronIds.has(a.id))
    .map(a => {
      const ultima = ultimaAsist.get(a.id) ?? null
      const dias = ultima
        ? Math.ceil((hoyDate.getTime() - new Date(ultima + 'T00:00:00').getTime()) / 86400000)
        : null
      return { nombre: a.nombre_completo, tipo: 'registrado', diasSinAsistir: dias, ultimaAsistencia: ultima ?? 'sin registros' }
    })

  const inactivosExtDetalle = (extActivos ?? [])
    .filter(a => !asistExtIds.has(a.id))
    .map(a => {
      const ultima = ultimaAsistExt.get(a.id) ?? null
      const dias = ultima
        ? Math.ceil((hoyDate.getTime() - new Date(ultima + 'T00:00:00').getTime()) / 86400000)
        : null
      return { nombre: a.nombre_completo, tipo: 'externo', diasSinAsistir: dias, ultimaAsistencia: ultima ?? 'sin registros' }
    })

  const inactivosDetalle = [...inactivosRegDetalle, ...inactivosExtDetalle]
    .sort((a, b) => (b.diasSinAsistir ?? 9999) - (a.diasSinAsistir ?? 9999))

  const inactivos = inactivosDetalle.length
  const topInactivos = inactivosDetalle.slice(0, 5).map(a => ({
    nombre: a.nombre,
    tipo: a.tipo,
    diasSinAsistirLabel: a.diasSinAsistir
      ? `${a.diasSinAsistir} día${a.diasSinAsistir !== 1 ? 's' : ''} sin asistir`
      : 'Nunca registró asistencia (posiblemente nuevo o sin inicio)',
  }))

  const totalMesReg = (cobros ?? []).reduce((s, c) => s + c.monto, 0)
  const totalMesExt = (cobrosExt ?? []).reduce((s, c) => s + c.monto, 0)
  const totalMes = totalMesReg + totalMesExt

  const prioridades: string[] = []
  if (mv > 0) prioridades.push(`${mv} membresía${mv !== 1 ? 's' : ''} vencida${mv !== 1 ? 's' : ''} con potencial de renovación`)
  if (mpv > 0) prioridades.push(`${mpv} membresía${mpv !== 1 ? 's' : ''} por vencer esta semana`)
  if (inactivos > 0) prioridades.push(`${inactivos} alumno${inactivos !== 1 ? 's' : ''} con membresía activa sin asistir en 14 días`)

  return {
    fecha: hoy,
    membresiasVencidas: mv,
    membresiasPorVencer: mpv,
    topPorVencer,
    alumnosInactivos14d: inactivos,
    topInactivos,
    ingresosMesActual: totalMes,
    ingresosMesFormateado: `$${totalMes.toLocaleString('es-AR')}`,
    prioridades,
    sinAlertas: prioridades.length === 0,
  }
}
