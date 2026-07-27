import { createAdminClient } from '@/lib/supabase/admin'

function hoyAR(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
}

export async function getAlumnosConMembresiaVencida(gimnasioId: string) {
  const supabase = createAdminClient()
  const hoy = hoyAR()
  const hoyDate = new Date(hoy + 'T00:00:00')

  const [{ data: registrados }, { data: externos }] = await Promise.all([
    supabase.from('alumnos')
      .select('id, nombre_completo, fecha_vencimiento')
      .eq('gimnasio_id', gimnasioId)
      .not('fecha_vencimiento', 'is', null)
      .lt('fecha_vencimiento', hoy)
      .order('fecha_vencimiento', { ascending: true }),
    supabase.from('alumnos_externos')
      .select('id, nombre_completo, fecha_vencimiento')
      .eq('gimnasio_id', gimnasioId)
      .is('alumno_id', null)
      .not('fecha_vencimiento', 'is', null)
      .lt('fecha_vencimiento', hoy)
      .order('fecha_vencimiento', { ascending: true }),
  ])

  function mapear(lista: { nombre_completo: string; fecha_vencimiento: string | null }[], tipo: 'registrado' | 'externo') {
    return (lista ?? []).map(a => {
      const diasVencida = Math.ceil(
        (hoyDate.getTime() - new Date(a.fecha_vencimiento! + 'T00:00:00').getTime()) / 86400000,
      )
      return {
        nombre: a.nombre_completo,
        tipo,
        fechaVencimiento: a.fecha_vencimiento!,
        diasVencida,
        estado: 'vencida' as const,
        estadoLabel: `Vencida hace ${diasVencida} día${diasVencida !== 1 ? 's' : ''}`,
      }
    })
  }

  const alumnos = [
    ...mapear(registrados ?? [], 'registrado'),
    ...mapear(externos ?? [], 'externo'),
  ].sort((a, b) => a.diasVencida - b.diasVencida)

  return {
    total: alumnos.length,
    registrados: (registrados ?? []).length,
    externos: (externos ?? []).length,
    alumnos,
  }
}

export async function getAlumnosConMembresiaProximaAVencer(gimnasioId: string, dias = 7) {
  const supabase = createAdminClient()
  const hoy = hoyAR()
  const hoyDate = new Date(hoy + 'T00:00:00')
  const hastaDate = new Date(hoyDate)
  hastaDate.setDate(hastaDate.getDate() + dias)
  const hasta = hastaDate.toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })

  const [{ data: registrados }, { data: externos }] = await Promise.all([
    supabase.from('alumnos')
      .select('id, nombre_completo, fecha_vencimiento')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha_vencimiento', hoy)
      .lte('fecha_vencimiento', hasta)
      .order('fecha_vencimiento', { ascending: true }),
    supabase.from('alumnos_externos')
      .select('id, nombre_completo, fecha_vencimiento')
      .eq('gimnasio_id', gimnasioId)
      .is('alumno_id', null)
      .not('fecha_vencimiento', 'is', null)
      .gte('fecha_vencimiento', hoy)
      .lte('fecha_vencimiento', hasta)
      .order('fecha_vencimiento', { ascending: true }),
  ])

  function mapear(lista: { nombre_completo: string; fecha_vencimiento: string | null }[], tipo: 'registrado' | 'externo') {
    return (lista ?? []).map(a => {
      const diasRestantes = Math.ceil(
        (new Date(a.fecha_vencimiento! + 'T00:00:00').getTime() - hoyDate.getTime()) / 86400000,
      )
      const estado = diasRestantes === 0 ? 'vence_hoy' : 'por_vencer'
      const estadoLabel = diasRestantes === 0
        ? 'Vence hoy'
        : `Le quedan ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}`
      return {
        nombre: a.nombre_completo,
        tipo,
        fechaVencimiento: a.fecha_vencimiento!,
        diasRestantes,
        estado,
        estadoLabel,
      }
    })
  }

  const alumnos = [
    ...mapear(registrados ?? [], 'registrado'),
    ...mapear(externos ?? [], 'externo'),
  ].sort((a, b) => a.diasRestantes - b.diasRestantes)

  return {
    total: alumnos.length,
    registrados: (registrados ?? []).length,
    externos: (externos ?? []).length,
    alumnos,
    periodoConsultado: dias,
  }
}

export async function getAlumnoResumen(gimnasioId: string, nombre: string) {
  const supabase = createAdminClient()
  const hoy = hoyAR()
  const hoyDate = new Date(hoy + 'T00:00:00')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: encontrados } = await (supabase as any).rpc('buscar_alumnos', {
    p_gimnasio_id: gimnasioId,
    p_nombre: nombre,
  })

  // Also search alumnos_externos
  const { data: externosEncontrados } = await supabase
    .from('alumnos_externos')
    .select('id, nombre_completo, fecha_vencimiento')
    .eq('gimnasio_id', gimnasioId)
    .is('alumno_id', null)
    .ilike('nombre_completo', `%${nombre}%`)
    .limit(3)

  const registradosCount = encontrados?.length ?? 0
  const externosCount = externosEncontrados?.length ?? 0
  const totalEncontrados = registradosCount + externosCount

  if (totalEncontrados === 0) {
    return { encontrado: false, mensaje: `No encontré ningún alumno con el nombre "${nombre}".` }
  }

  if (totalEncontrados > 1) {
    const opciones = [
      ...(encontrados ?? []).map((a: { nombre_completo: string }) => `${a.nombre_completo} (registrado)`),
      ...(externosEncontrados ?? []).map(a => `${a.nombre_completo} (importado)`),
    ]
    return {
      encontrado: false,
      ambiguo: true,
      mensaje: `Encontré ${totalEncontrados} alumnos con ese nombre. ¿A cuál te referís?`,
      opciones,
    }
  }

  // Externo
  if (registradosCount === 0 && externosCount === 1) {
    const ext = externosEncontrados![0]
    const primerDiaMes = hoy.slice(0, 7) + '-01'

    const [{ count: asistenciasEsteMes }, { data: ultimaAsist }, { data: cobros }] = await Promise.all([
      supabase.from('asistencias_externas')
        .select('*', { count: 'exact', head: true })
        .eq('alumno_externo_id', ext.id)
        .eq('gimnasio_id', gimnasioId)
        .gte('fecha', primerDiaMes),
      supabase.from('asistencias_externas')
        .select('fecha')
        .eq('alumno_externo_id', ext.id)
        .eq('gimnasio_id', gimnasioId)
        .order('fecha', { ascending: false })
        .limit(1),
      supabase.from('cobros_externos')
        .select('monto, fecha, metodo, estado')
        .eq('alumno_externo_id', ext.id)
        .eq('gimnasio_id', gimnasioId)
        .order('fecha', { ascending: false })
        .limit(5),
    ])

    let estadoMembresia = 'Sin fecha de vencimiento cargada'
    if (ext.fecha_vencimiento) {
      const dias = Math.ceil(
        (new Date(ext.fecha_vencimiento + 'T00:00:00').getTime() - hoyDate.getTime()) / 86400000,
      )
      if (dias < 0) estadoMembresia = `Vencida hace ${Math.abs(dias)} día${Math.abs(dias) !== 1 ? 's' : ''}`
      else if (dias === 0) estadoMembresia = 'Vence hoy'
      else estadoMembresia = `Al día, vence en ${dias} día${dias !== 1 ? 's' : ''}`
    }

    return {
      encontrado: true,
      tipo: 'externo',
      nombre: ext.nombre_completo,
      estadoMembresia,
      asistenciasEsteMes: asistenciasEsteMes ?? 0,
      ultimaAsistencia: ultimaAsist?.[0]?.fecha ?? null,
      ultimosCobros: (cobros ?? [])
        .filter(c => c.estado !== 'anulado')
        .slice(0, 3)
        .map(c => ({ monto: c.monto, fecha: c.fecha, metodo: c.metodo })),
    }
  }

  // Registrado
  const alumno = encontrados[0]
  const primerDiaMes = hoy.slice(0, 7) + '-01'

  const [{ count: asistenciasEsteMes }, { data: ultimaAsist }, { data: cobros }] = await Promise.all([
    supabase.from('asistencias')
      .select('*', { count: 'exact', head: true })
      .eq('alumno_id', alumno.id)
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha', primerDiaMes),
    supabase.from('asistencias')
      .select('fecha')
      .eq('alumno_id', alumno.id)
      .eq('gimnasio_id', gimnasioId)
      .order('fecha', { ascending: false })
      .limit(1),
    supabase.from('cobros')
      .select('monto, fecha, metodo, estado')
      .eq('alumno_id', alumno.id)
      .eq('gimnasio_id', gimnasioId)
      .order('fecha', { ascending: false })
      .limit(5),
  ])

  let estadoMembresia = 'Sin fecha de vencimiento cargada'
  if (alumno.fecha_vencimiento) {
    const dias = Math.ceil(
      (new Date(alumno.fecha_vencimiento + 'T00:00:00').getTime() - hoyDate.getTime()) / 86400000,
    )
    if (dias < 0) estadoMembresia = `Vencida hace ${Math.abs(dias)} día${Math.abs(dias) !== 1 ? 's' : ''}`
    else if (dias === 0) estadoMembresia = 'Vence hoy'
    else estadoMembresia = `Al día, vence en ${dias} día${dias !== 1 ? 's' : ''}`
  }

  return {
    encontrado: true,
    tipo: 'registrado',
    nombre: alumno.nombre_completo,
    estadoMembresia,
    asistenciasEsteMes: asistenciasEsteMes ?? 0,
    ultimaAsistencia: ultimaAsist?.[0]?.fecha ?? null,
    ultimosCobros: (cobros ?? [])
      .filter(c => c.estado !== 'anulado')
      .slice(0, 3)
      .map(c => ({ monto: c.monto, fecha: c.fecha, metodo: c.metodo })),
  }
}
