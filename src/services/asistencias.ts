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

  const [
    { data: alumnosActivos },
    { data: asistenciasRecientes },
    { data: ultimasAsistencias },
    { data: extActivos },
    { data: asistExtRecientes },
    { data: ultimasAsistExt },
  ] = await Promise.all([
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
    supabase.from('alumnos_externos')
      .select('id, nombre_completo')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha_vencimiento', hoy)
      .is('alumno_id', null),
    supabase.from('asistencias_externas')
      .select('alumno_externo_id')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha', desde),
    supabase.from('asistencias_externas')
      .select('alumno_externo_id, fecha')
      .eq('gimnasio_id', gimnasioId)
      .order('fecha', { ascending: false })
      .limit(2000),
  ])

  const asistieronIds = new Set((asistenciasRecientes ?? []).map(a => a.alumno_id))
  const ultimaAsist = new Map<string, string>()
  for (const a of ultimasAsistencias ?? []) {
    if (!ultimaAsist.has(a.alumno_id)) ultimaAsist.set(a.alumno_id, a.fecha)
  }

  const asistExtIds = new Set((asistExtRecientes ?? []).map(a => a.alumno_externo_id))
  const ultimaAsistExt = new Map<string, string>()
  for (const a of ultimasAsistExt ?? []) {
    if (!ultimaAsistExt.has(a.alumno_externo_id)) ultimaAsistExt.set(a.alumno_externo_id, a.fecha)
  }

  type InactivoItem = {
    nombre: string
    diasSinAsistir: number | null
    ultimaAsistencia: string
    tipo: 'registrado' | 'externo'
  }

  const inactivosReg: InactivoItem[] = (alumnosActivos ?? [])
    .filter(a => !asistieronIds.has(a.id))
    .map(a => {
      const ultima = ultimaAsist.get(a.id) ?? null
      const diasSinAsistir = ultima
        ? Math.ceil((hoyDate.getTime() - new Date(ultima + 'T00:00:00').getTime()) / 86400000)
        : null
      return { nombre: a.nombre_completo, diasSinAsistir, ultimaAsistencia: ultima ?? 'sin registros', tipo: 'registrado' as const }
    })

  const inactivosExt: InactivoItem[] = (extActivos ?? [])
    .filter(a => !asistExtIds.has(a.id))
    .map(a => {
      const ultima = ultimaAsistExt.get(a.id) ?? null
      const diasSinAsistir = ultima
        ? Math.ceil((hoyDate.getTime() - new Date(ultima + 'T00:00:00').getTime()) / 86400000)
        : null
      return { nombre: a.nombre_completo, diasSinAsistir, ultimaAsistencia: ultima ?? 'sin registros', tipo: 'externo' as const }
    })

  const inactivos = [...inactivosReg, ...inactivosExt]
    .sort((a, b) => (b.diasSinAsistir ?? 9999) - (a.diasSinAsistir ?? 9999))
    .slice(0, limit)
    .map(a => ({
      nombre: a.nombre,
      tipo: a.tipo,
      diasSinAsistir: a.diasSinAsistir ?? `más de ${dias}`,
      diasSinAsistirLabel: a.diasSinAsistir
        ? `${a.diasSinAsistir} día${a.diasSinAsistir !== 1 ? 's' : ''} sin asistir`
        : 'Sin registros de asistencia',
      ultimaAsistencia: a.ultimaAsistencia,
    }))

  return {
    total: inactivos.length,
    registrados: inactivosReg.length,
    externos: inactivosExt.length,
    alumnos: inactivos,
    periodoConsultado: dias,
  }
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
    { data: extActivos },
    { data: asistExtRecientes },
    { data: ultimasAsistExt },
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
    supabase.from('alumnos_externos')
      .select('id, nombre_completo, fecha_vencimiento')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha_vencimiento', hoy)
      .is('alumno_id', null),
    supabase.from('asistencias_externas')
      .select('alumno_externo_id')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha', desde),
    supabase.from('asistencias_externas')
      .select('alumno_externo_id, fecha')
      .eq('gimnasio_id', gimnasioId)
      .order('fecha', { ascending: false })
      .limit(2000),
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

  const asistExtIds = new Set((asistExtRecientes ?? []).map((a: { alumno_externo_id: string }) => a.alumno_externo_id))
  const ultimaAsistExt = new Map<string, string>()
  for (const a of (ultimasAsistExt ?? [])) {
    if (!ultimaAsistExt.has(a.alumno_externo_id)) ultimaAsistExt.set(a.alumno_externo_id, a.fecha)
  }

  type RiesgoItem = {
    nombre: string
    tipo: 'registrado' | 'externo'
    diasSinAsistir: number | null
    sinRegistroAsistencia: boolean
    venceEn: number
    fechaVencimiento: string
    ultimoContacto: string | null
  }

  const inactivosReg: RiesgoItem[] = (alumnosActivos ?? [])
    .filter((a: { id: string; fecha_vencimiento: string | null }) => !asistieronIds.has(a.id) && a.fecha_vencimiento !== null)
    .map((a: { id: string; nombre_completo: string; fecha_vencimiento: string | null }) => {
      const ultima = ultimaAsist.get(a.id) ?? null
      const diasSinAsistir = ultima
        ? Math.ceil((hoyDate.getTime() - new Date(ultima + 'T00:00:00').getTime()) / 86400000)
        : null
      const venceEn = Math.ceil((new Date(a.fecha_vencimiento! + 'T00:00:00').getTime() - hoyDate.getTime()) / 86400000)
      return {
        nombre: a.nombre_completo,
        tipo: 'registrado' as const,
        diasSinAsistir,
        sinRegistroAsistencia: diasSinAsistir === null,
        venceEn,
        fechaVencimiento: a.fecha_vencimiento!,
        ultimoContacto: ultimoContactoMap.get(a.id) ?? null,
      }
    })

  const inactivosExt: RiesgoItem[] = (extActivos ?? [])
    .filter((a: { id: string; fecha_vencimiento: string | null }) => !asistExtIds.has(a.id) && a.fecha_vencimiento !== null)
    .map((a: { id: string; nombre_completo: string; fecha_vencimiento: string | null }) => {
      const ultima = ultimaAsistExt.get(a.id) ?? null
      const diasSinAsistir = ultima
        ? Math.ceil((hoyDate.getTime() - new Date(ultima + 'T00:00:00').getTime()) / 86400000)
        : null
      const venceEn = Math.ceil((new Date(a.fecha_vencimiento! + 'T00:00:00').getTime() - hoyDate.getTime()) / 86400000)
      return {
        nombre: a.nombre_completo,
        tipo: 'externo' as const,
        diasSinAsistir,
        sinRegistroAsistencia: diasSinAsistir === null,
        venceEn,
        fechaVencimiento: a.fecha_vencimiento!,
        ultimoContacto: null,
      }
    })

  const inactivos = [...inactivosReg, ...inactivosExt]
    .sort((a, b) => (b.diasSinAsistir ?? 9999) - (a.diasSinAsistir ?? 9999))
    .slice(0, limit)

  return { total: inactivos.length, registrados: inactivosReg.length, externos: inactivosExt.length, periodoConsultado: dias, alumnos: inactivos }
}

export async function getAsistenciaPorRango(gimnasioId: string, desde: string, hasta: string) {
  const supabase = createAdminClient()

  const [{ data: asistencias }, { data: asistenciasExt }] = await Promise.all([
    supabase.from('asistencias')
      .select('fecha, alumno_id')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha', desde)
      .lte('fecha', hasta)
      .order('fecha', { ascending: true }),
    supabase.from('asistencias_externas')
      .select('fecha, alumno_externo_id')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha', desde)
      .lte('fecha', hasta),
  ])

  const totalRegistrados = asistencias?.length ?? 0
  const totalExternos = asistenciasExt?.length ?? 0
  const total = totalRegistrados + totalExternos

  const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const porDia: Record<string, number> = {}
  const porFecha: Record<string, number> = {}

  for (const a of [...(asistencias ?? []), ...(asistenciasExt ?? [])]) {
    const dow = DIAS[new Date(a.fecha + 'T12:00:00').getDay()]
    porDia[dow] = (porDia[dow] ?? 0) + 1
    porFecha[a.fecha] = (porFecha[a.fecha] ?? 0) + 1
  }

  const diasConAsistencia = Object.keys(porFecha).length
  const promedioDiario = diasConAsistencia > 0 ? Math.round((total / diasConAsistencia) * 10) / 10 : 0
  const diaMasConcurrido = Object.entries(porDia).sort((a, b) => b[1] - a[1])[0]

  return {
    desde,
    hasta,
    totalAsistencias: total,
    registrados: totalRegistrados,
    externos: totalExternos,
    diasConAsistencia,
    promedioDiario,
    diaMasConcurrido: diaMasConcurrido ? { dia: diaMasConcurrido[0], cantidad: diaMasConcurrido[1] } : null,
    porDiaSemana: DIAS.map(d => ({ dia: d, cantidad: porDia[d] ?? 0 })).filter(d => d.cantidad > 0),
    detallePorDia: Object.entries(porFecha).map(([fecha, cantidad]) => ({
      fecha,
      diaSemana: DIAS[new Date(fecha + 'T12:00:00').getDay()],
      cantidad,
    })),
  }
}

export async function getAlumnosSinAsistenciaPorRango(
  gimnasioId: string,
  desde: string,
  hasta: string,
  desdeAnterior?: string,
  hastaAnterior?: string,
) {
  const supabase = createAdminClient()
  const hoy = hoyAR()

  const [
    { data: alumnosActivos },
    { data: asistenciasRango },
    asistenciasAnteriorRaw,
    { data: extActivos },
    { data: asistExtRango },
    asistExtAnteriorRaw,
  ] = await Promise.all([
    supabase.from('alumnos')
      .select('id, nombre_completo')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha_vencimiento', hoy),
    supabase.from('asistencias')
      .select('alumno_id')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha', desde)
      .lte('fecha', hasta),
    desdeAnterior && hastaAnterior
      ? supabase.from('asistencias')
          .select('alumno_id')
          .eq('gimnasio_id', gimnasioId)
          .gte('fecha', desdeAnterior)
          .lte('fecha', hastaAnterior)
      : Promise.resolve({ data: null }),
    supabase.from('alumnos_externos')
      .select('id, nombre_completo')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha_vencimiento', hoy)
      .is('alumno_id', null),
    supabase.from('asistencias_externas')
      .select('alumno_externo_id')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha', desde)
      .lte('fecha', hasta),
    desdeAnterior && hastaAnterior
      ? supabase.from('asistencias_externas')
          .select('alumno_externo_id')
          .eq('gimnasio_id', gimnasioId)
          .gte('fecha', desdeAnterior)
          .lte('fecha', hastaAnterior)
      : Promise.resolve({ data: null }),
  ])

  const asistieronEnRango = new Set((asistenciasRango ?? []).map(a => a.alumno_id))
  const asistieronEnAnterior = asistenciasAnteriorRaw.data
    ? new Set(asistenciasAnteriorRaw.data.map((a: { alumno_id: string }) => a.alumno_id))
    : null

  const asistExtEnRango = new Set((asistExtRango ?? []).map(a => a.alumno_externo_id))
  const asistExtEnAnterior = asistExtAnteriorRaw.data
    ? new Set(asistExtAnteriorRaw.data.map((a: { alumno_externo_id: string }) => a.alumno_externo_id))
    : null

  const noAsistieronReg = (alumnosActivos ?? []).filter(a => !asistieronEnRango.has(a.id))
  const noAsistieronExt = (extActivos ?? []).filter(a => !asistExtEnRango.has(a.id))

  const totalActivos = (alumnosActivos?.length ?? 0) + (extActivos?.length ?? 0)
  const totalSinAsistir = noAsistieronReg.length + noAsistieronExt.length

  if (asistieronEnAnterior && asistExtEnAnterior) {
    const dejaronDeVenir = [
      ...noAsistieronReg.filter(a => asistieronEnAnterior!.has(a.id)).map(a => a.nombre_completo),
      ...noAsistieronExt.filter(a => asistExtEnAnterior!.has(a.id)).map(a => a.nombre_completo),
    ].slice(0, 50)

    const ausentesEnAmbos = [
      ...noAsistieronReg.filter(a => !asistieronEnAnterior!.has(a.id)).map(a => a.nombre_completo),
      ...noAsistieronExt.filter(a => !asistExtEnAnterior!.has(a.id)).map(a => a.nombre_completo),
    ].slice(0, 50)

    return {
      desde,
      hasta,
      periodoAnterior: { desde: desdeAnterior, hasta: hastaAnterior },
      totalActivos,
      totalSinAsistirEnRango: totalSinAsistir,
      dejaronDeVenir: {
        descripcion: 'Asistieron en el período anterior pero NO en el período principal',
        total: dejaronDeVenir.length,
        alumnos: dejaronDeVenir,
      },
      ausentesEnAmbos: {
        descripcion: 'No asistieron en ninguno de los dos períodos',
        total: ausentesEnAmbos.length,
        alumnos: ausentesEnAmbos,
      },
    }
  }

  return {
    desde,
    hasta,
    totalActivos,
    totalSinAsistir,
    registradosSinAsistir: noAsistieronReg.length,
    externosSinAsistir: noAsistieronExt.length,
    alumnos: [
      ...noAsistieronReg.map(a => a.nombre_completo),
      ...noAsistieronExt.map(a => a.nombre_completo),
    ].slice(0, 50),
  }
}

export async function getResumenAsistencia(gimnasioId: string) {
  const supabase = createAdminClient()
  const hoy = hoyAR()
  const primerDiaMes = hoy.slice(0, 7) + '-01'

  const [{ data: asistencias }, { data: asistenciasExt }] = await Promise.all([
    supabase.from('asistencias')
      .select('fecha, checked_in_at')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha', primerDiaMes),
    supabase.from('asistencias_externas')
      .select('fecha')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha', primerDiaMes),
  ])

  const totalRegistrados = asistencias?.length ?? 0
  const totalExternos = asistenciasExt?.length ?? 0
  const total = totalRegistrados + totalExternos

  const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const porDia: Record<string, number> = {}
  const diasUnicos = new Set<string>()

  for (const a of [...(asistencias ?? []), ...(asistenciasExt ?? [])]) {
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
    registrados: totalRegistrados,
    externos: totalExternos,
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
