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
      .order('fecha', { ascending: true })
      .limit(50000),
    supabase.from('asistencias_externas')
      .select('fecha, alumno_externo_id')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha', desde)
      .lte('fecha', hasta)
      .limit(50000),
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
      .lte('fecha', hasta)
      .limit(50000),
    desdeAnterior && hastaAnterior
      ? supabase.from('asistencias')
          .select('alumno_id')
          .eq('gimnasio_id', gimnasioId)
          .gte('fecha', desdeAnterior)
          .lte('fecha', hastaAnterior)
          .limit(50000)
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
      .lte('fecha', hasta)
      .limit(50000),
    desdeAnterior && hastaAnterior
      ? supabase.from('asistencias_externas')
          .select('alumno_externo_id')
          .eq('gimnasio_id', gimnasioId)
          .gte('fecha', desdeAnterior)
          .lte('fecha', hastaAnterior)
          .limit(50000)
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
    const dejRegNames = noAsistieronReg.filter(a => asistieronEnAnterior!.has(a.id)).map(a => a.nombre_completo)
    const dejExtNames = noAsistieronExt.filter(a => asistExtEnAnterior!.has(a.id)).map(a => a.nombre_completo)
    const ausRegNames = noAsistieronReg.filter(a => !asistieronEnAnterior!.has(a.id)).map(a => a.nombre_completo)
    const ausExtNames = noAsistieronExt.filter(a => !asistExtEnAnterior!.has(a.id)).map(a => a.nombre_completo)

    return {
      desde,
      hasta,
      periodoAnterior: { desde: desdeAnterior, hasta: hastaAnterior },
      totalActivos,
      totalSinAsistirEnRango: totalSinAsistir,
      dejaronDeVenir: {
        descripcion: 'Asistieron en el período anterior pero NO en el período principal',
        total: dejRegNames.length + dejExtNames.length,
        totalRegistrados: dejRegNames.length,
        totalExternos: dejExtNames.length,
        registrados: dejRegNames.slice(0, 50),
        externos: dejExtNames.slice(0, 50),
      },
      ausentesEnAmbos: {
        descripcion: 'No asistieron en ninguno de los dos períodos',
        total: ausRegNames.length + ausExtNames.length,
        totalRegistrados: ausRegNames.length,
        totalExternos: ausExtNames.length,
        registrados: ausRegNames.slice(0, 50),
        externos: ausExtNames.slice(0, 50),
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
    registrados: noAsistieronReg.map(a => a.nombre_completo).slice(0, 50),
    externos: noAsistieronExt.map(a => a.nombre_completo).slice(0, 50),
  }
}

export async function getQuienesDejaronDeAsistir(
  gimnasioId: string,
  periodo1Desde: string,
  periodo1Hasta: string,
  periodo2Desde: string,
  periodo2Hasta: string,
  limit = 60,
) {
  const supabase = createAdminClient()
  const hoy = hoyAR()
  const hoyDate = new Date(hoy + 'T00:00:00')

  // Period 2 is entirely in the future — no attendance data can exist yet
  if (periodo2Desde > hoy) {
    return {
      error: true,
      mensaje: `El segundo período (${periodo2Desde} a ${periodo2Hasta}) aún no ocurrió (hoy es ${hoy}). No hay asistencias registradas para fechas futuras, por eso el resultado aparece inflado. Usá un período que ya haya pasado para comparar.`,
      sugerencia: `Si querés ver quién asistió entre ${periodo1Desde} y ${periodo1Hasta} pero no volvió desde entonces, podés comparar con el período ${periodo1Hasta} a ${hoy}.`,
      periodo1: { desde: periodo1Desde, hasta: periodo1Hasta },
      periodo2: { desde: periodo2Desde, hasta: periodo2Hasta },
    }
  }

  // Period 2 partially extends into the future — cap at today
  const periodo2HastaCapped = periodo2Hasta > hoy ? hoy : periodo2Hasta

  const [
    { data: asist1Reg },
    { data: asist1Ext },
    { data: asist2Reg },
    { data: asist2Ext },
    { data: ultimasReg },
    { data: ultimasExt },
    { data: alumnos },
    { data: externos },
  ] = await Promise.all([
    supabase.from('asistencias')
      .select('alumno_id, fecha')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha', periodo1Desde)
      .lte('fecha', periodo1Hasta)
      .limit(50000),
    supabase.from('asistencias_externas')
      .select('alumno_externo_id, fecha')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha', periodo1Desde)
      .lte('fecha', periodo1Hasta)
      .limit(50000),
    supabase.from('asistencias')
      .select('alumno_id')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha', periodo2Desde)
      .lte('fecha', periodo2HastaCapped)
      .limit(50000),
    supabase.from('asistencias_externas')
      .select('alumno_externo_id')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha', periodo2Desde)
      .lte('fecha', periodo2HastaCapped)
      .limit(50000),
    supabase.from('asistencias')
      .select('alumno_id, fecha')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha', periodo1Desde)
      .order('fecha', { ascending: false })
      .limit(5000),
    supabase.from('asistencias_externas')
      .select('alumno_externo_id, fecha')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha', periodo1Desde)
      .order('fecha', { ascending: false })
      .limit(5000),
    supabase.from('alumnos')
      .select('id, nombre_completo, fecha_vencimiento, whatsapp')
      .eq('gimnasio_id', gimnasioId),
    supabase.from('alumnos_externos')
      .select('id, nombre_completo, fecha_vencimiento, whatsapp')
      .eq('gimnasio_id', gimnasioId)
      .is('alumno_id', null),
  ])

  const p1RegIds = new Set<string>()
  const p1RegCount = new Map<string, number>()
  for (const a of (asist1Reg ?? [])) {
    p1RegIds.add(a.alumno_id)
    p1RegCount.set(a.alumno_id, (p1RegCount.get(a.alumno_id) ?? 0) + 1)
  }
  const p1ExtIds = new Set<string>()
  const p1ExtCount = new Map<string, number>()
  for (const a of (asist1Ext ?? [])) {
    p1ExtIds.add(a.alumno_externo_id)
    p1ExtCount.set(a.alumno_externo_id, (p1ExtCount.get(a.alumno_externo_id) ?? 0) + 1)
  }

  const p2RegIds = new Set((asist2Reg ?? []).map(a => a.alumno_id))
  const p2ExtIds = new Set((asist2Ext ?? []).map(a => a.alumno_externo_id))

  const ultimaRegMap = new Map<string, string>()
  for (const a of (ultimasReg ?? [])) {
    if (!ultimaRegMap.has(a.alumno_id)) ultimaRegMap.set(a.alumno_id, a.fecha)
  }
  const ultimaExtMap = new Map<string, string>()
  for (const a of (ultimasExt ?? [])) {
    if (!ultimaExtMap.has(a.alumno_externo_id)) ultimaExtMap.set(a.alumno_externo_id, a.fecha)
  }

  const alumnosMap = new Map((alumnos ?? []).map(a => [a.id, a]))
  const externosMap = new Map((externos ?? []).map(a => [a.id, a]))

  function estadoMembresia(fechaVenc: string | null) {
    if (!fechaVenc) return 'sin fecha'
    const dias = Math.ceil((new Date(fechaVenc + 'T00:00:00').getTime() - hoyDate.getTime()) / 86400000)
    if (dias < 0) return 'vencida'
    if (dias === 0) return 'vence hoy'
    if (dias <= 7) return `vence en ${dias} días`
    return 'activa'
  }

  type ResultItem = {
    nombre: string
    tipo: 'con cuenta' | 'sin cuenta'
    ultimaAsistencia: string
    asistenciasEnPeriodo1: number
    estadoMembresia: string
    fechaVencimiento: string | null
    whatsapp: string | null
  }

  const resultado: ResultItem[] = []

  for (const id of p1RegIds) {
    if (p2RegIds.has(id)) continue
    const alumno = alumnosMap.get(id)
    if (!alumno) continue
    resultado.push({
      nombre: alumno.nombre_completo,
      tipo: 'con cuenta',
      ultimaAsistencia: ultimaRegMap.get(id) ?? 'sin registros',
      asistenciasEnPeriodo1: p1RegCount.get(id) ?? 0,
      estadoMembresia: estadoMembresia(alumno.fecha_vencimiento),
      fechaVencimiento: alumno.fecha_vencimiento,
      whatsapp: alumno.whatsapp ?? null,
    })
  }

  for (const id of p1ExtIds) {
    if (p2ExtIds.has(id)) continue
    const externo = externosMap.get(id)
    if (!externo) continue
    resultado.push({
      nombre: externo.nombre_completo,
      tipo: 'sin cuenta',
      ultimaAsistencia: ultimaExtMap.get(id) ?? 'sin registros',
      asistenciasEnPeriodo1: p1ExtCount.get(id) ?? 0,
      estadoMembresia: estadoMembresia(externo.fecha_vencimiento ?? null),
      fechaVencimiento: externo.fecha_vencimiento ?? null,
      whatsapp: externo.whatsapp ?? null,
    })
  }

  resultado.sort((a, b) => {
    if (a.ultimaAsistencia === 'sin registros') return 1
    if (b.ultimaAsistencia === 'sin registros') return -1
    return b.ultimaAsistencia.localeCompare(a.ultimaAsistencia)
  })

  const registradosArr = resultado.filter(r => r.tipo === 'con cuenta')
  const externosArr    = resultado.filter(r => r.tipo === 'sin cuenta')

  return {
    periodo1: { desde: periodo1Desde, hasta: periodo1Hasta },
    periodo2: { desde: periodo2Desde, hasta: periodo2Hasta },
    total: resultado.length,
    totalRegistrados: registradosArr.length,
    totalExternos: externosArr.length,
    descripcion: `Alumnos que asistieron entre ${periodo1Desde} y ${periodo1Hasta}, pero NO asistieron entre ${periodo2Desde} y ${periodo2HastaCapped}${periodo2HastaCapped !== periodo2Hasta ? ` (período ajustado a hoy, ${hoy})` : ''}`,
    registrados: registradosArr.slice(0, limit),
    externos: externosArr.slice(0, limit),
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
      .gte('fecha', primerDiaMes)
      .limit(50000),
    supabase.from('asistencias_externas')
      .select('fecha')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha', primerDiaMes)
      .limit(50000),
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
