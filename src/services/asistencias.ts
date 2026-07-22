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
  const hoyDate = new Date(hoy + 'T00:00:00')
  const desde = addDays(hoy, -dias)

  const [{ data: alumnosActivos }, { data: asistenciasRecientes }, { data: ultimasAsistencias }] = await Promise.all([
    supabase.from('alumnos')
      .select('id, nombre_completo')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha_vencimiento', hoy),
    supabase.from('asistencias')
      .select('alumno_id')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha', desde),
    supabase.from('asistencias')
      .select('alumno_id, fecha')
      .eq('gimnasio_id', gimnasioId)
      .order('fecha', { ascending: false })
      .limit(2000),
  ])

  const asistieronIds = new Set((asistenciasRecientes ?? []).map(a => a.alumno_id))
  const ultimaAsist = new Map<string, string>()
  for (const a of ultimasAsistencias ?? []) {
    if (!ultimaAsist.has(a.alumno_id)) ultimaAsist.set(a.alumno_id, a.fecha)
  }

  const inactivos = (alumnosActivos ?? [])
    .filter(a => !asistieronIds.has(a.id))
    .map(a => {
      const ultima = ultimaAsist.get(a.id) ?? null
      const diasSinAsistir = ultima
        ? Math.ceil((hoyDate.getTime() - new Date(ultima + 'T00:00:00').getTime()) / 86400000)
        : null
      return { nombre: a.nombre_completo, diasSinAsistir, ultimaAsistencia: ultima ?? 'sin registros' }
    })
    .sort((a, b) => (b.diasSinAsistir ?? 9999) - (a.diasSinAsistir ?? 9999))
    .slice(0, limit)
    .map(a => ({
      nombre: a.nombre,
      diasSinAsistir: a.diasSinAsistir ?? `más de ${dias}`,
      diasSinAsistirLabel: a.diasSinAsistir
        ? `${a.diasSinAsistir} día${a.diasSinAsistir !== 1 ? 's' : ''} sin asistir`
        : 'Sin registros de asistencia',
      ultimaAsistencia: a.ultimaAsistencia,
    }))

  return { total: inactivos.length, alumnos: inactivos, periodoConsultado: dias }
}

export async function getAlumnosEnRiesgo(gimnasioId: string, dias = 14, limit = 30) {
  const supabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAny = supabase as any
  const hoy = hoyAR()
  const hoyDate = new Date(hoy + 'T00:00:00')
  const desde = addDays(hoy, -dias)

  const [
    { data: alumnosActivos },
    { data: asistenciasRecientes },
    { data: ultimasAsistencias },
    { data: ultimosContactos },
  ] = await Promise.all([
    supabase.from('alumnos')
      .select('id, nombre_completo, fecha_vencimiento')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha_vencimiento', hoy),
    supabase.from('asistencias')
      .select('alumno_id')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha', desde),
    supabase.from('asistencias')
      .select('alumno_id, fecha')
      .eq('gimnasio_id', gimnasioId)
      .order('fecha', { ascending: false })
      .limit(2000),
    supabaseAny.from('contactos_alumnos')
      .select('alumno_id, fecha_contacto')
      .eq('gimnasio_id', gimnasioId)
      .order('fecha_contacto', { ascending: false })
      .limit(1000),
  ])

  const asistieronIds = new Set((asistenciasRecientes ?? []).map((a: { alumno_id: string }) => a.alumno_id))

  const ultimaAsist = new Map<string, string>()
  for (const a of (ultimasAsistencias ?? [])) {
    if (!ultimaAsist.has(a.alumno_id)) ultimaAsist.set(a.alumno_id, a.fecha)
  }

  const ultimoContactoMap = new Map<string, string>()
  for (const c of (ultimosContactos ?? [])) {
    if (!ultimoContactoMap.has(c.alumno_id)) ultimoContactoMap.set(c.alumno_id, c.fecha_contacto)
  }

  const inactivos = (alumnosActivos ?? [])
    .filter((a: { id: string }) => !asistieronIds.has(a.id))
    .map((a: { id: string; nombre_completo: string; fecha_vencimiento: string }) => {
      const ultima = ultimaAsist.get(a.id) ?? null
      const diasSinAsistir = ultima
        ? Math.ceil((hoyDate.getTime() - new Date(ultima + 'T00:00:00').getTime()) / 86400000)
        : null
      const venceEn = Math.ceil((new Date(a.fecha_vencimiento + 'T00:00:00').getTime() - hoyDate.getTime()) / 86400000)
      return {
        nombre: a.nombre_completo,
        diasSinAsistir,
        sinRegistroAsistencia: diasSinAsistir === null,
        venceEn,
        fechaVencimiento: a.fecha_vencimiento,
        ultimoContacto: ultimoContactoMap.get(a.id) ?? null,
      }
    })
    .sort((a: { diasSinAsistir: number | null }, b: { diasSinAsistir: number | null }) =>
      (b.diasSinAsistir ?? 9999) - (a.diasSinAsistir ?? 9999)
    )
    .slice(0, limit)

  return { total: inactivos.length, periodoConsultado: dias, alumnos: inactivos }
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

  const diaDelMes = parseInt(hoy.slice(8, 10))

  return {
    totalEsteMes: total,
    promedioDiario,
    diasConAsistencia,
    diasTranscurridosDelMes: diaDelMes,
    periodoCompleto: diaDelMes >= 28,
    nota: diasConAsistencia < 10
      ? `Período con pocos registros (${diasConAsistencia} días). Interpretá los datos con cautela.`
      : null,
    diaMasConcurrido: diaMasConcurrido
      ? { dia: diaMasConcurrido[0], cantidad: diaMasConcurrido[1] }
      : null,
    porDiaSemana: DIAS.map(d => ({ dia: d, cantidad: porDia[d] ?? 0 })),
    aclaracion: 'porDiaSemana refleja el acumulado de asistencias por día de la semana en el período, no el promedio.',
  }
}
