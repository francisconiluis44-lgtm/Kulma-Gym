import { createAdminClient } from '@/lib/supabase/admin'

function hoyAR(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export async function getAlumnosSinAsistir(gimnasioId: string, dias = 14, limit = 20) {
  const supabase = createAdminClient()
  const hoy = hoyAR()
  const desde = addDays(hoy, -dias)

  const [{ data: alumnosActivos }, { data: asistencias }] = await Promise.all([
    supabase.from('alumnos')
      .select('id, nombre_completo')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha_vencimiento', hoy),
    supabase.from('asistencias')
      .select('alumno_id, fecha')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha', desde)
      .order('fecha', { ascending: false }),
  ])

  const asistieronIds = new Set((asistencias ?? []).map(a => a.alumno_id))
  const ultimaAsist = new Map<string, string>()
  for (const a of asistencias ?? []) {
    if (!ultimaAsist.has(a.alumno_id)) ultimaAsist.set(a.alumno_id, a.fecha)
  }

  const inactivos = (alumnosActivos ?? [])
    .filter(a => !asistieronIds.has(a.id))
    .slice(0, limit)
    .map(a => ({
      nombre: a.nombre_completo,
      diasSinAsistir: `más de ${dias}`,
      ultimaAsistencia: ultimaAsist.get(a.id) ?? 'sin registros recientes',
    }))

  return { total: inactivos.length, alumnos: inactivos, periodoConsultado: dias }
}

export async function getResumenAsistencia(gimnasioId: string) {
  const supabase = createAdminClient()
  const hoy = hoyAR()
  const primerDiaMes = hoy.slice(0, 7) + '-01'

  const { data: asistencias } = await supabase
    .from('asistencias')
    .select('fecha, checked_in_at')
    .eq('gimnasio_id', gimnasioId)
    .gte('fecha', primerDiaMes)

  const total = asistencias?.length ?? 0
  const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const porDia: Record<string, number> = {}
  const diasUnicos = new Set<string>()

  for (const a of asistencias ?? []) {
    const dow = DIAS[new Date(a.fecha + 'T12:00:00').getDay()]
    porDia[dow] = (porDia[dow] ?? 0) + 1
    diasUnicos.add(a.fecha)
  }

  const diasConAsistencia = diasUnicos.size
  const promedioDiario = diasConAsistencia > 0 ? Math.round(total / diasConAsistencia) : 0
  const diaMasConcurrido = Object.entries(porDia).sort((a, b) => b[1] - a[1])[0]

  return {
    totalEsteMes: total,
    promedioDiario,
    diasConAsistencia,
    diaMasConcurrido: diaMasConcurrido
      ? { dia: diaMasConcurrido[0], cantidad: diaMasConcurrido[1] }
      : null,
    porDiaSemana: DIAS.map(d => ({ dia: d, cantidad: porDia[d] ?? 0 })),
  }
}
