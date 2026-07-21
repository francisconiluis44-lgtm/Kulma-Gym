import { createAdminClient } from '@/lib/supabase/admin'

function hoyAR(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
}

export async function getAlumnosConMembresiaVencida(gimnasioId: string) {
  const supabase = createAdminClient()
  const hoy = hoyAR()
  const hoyDate = new Date(hoy + 'T00:00:00')

  const { data } = await supabase
    .from('alumnos')
    .select('id, nombre_completo, fecha_vencimiento')
    .eq('gimnasio_id', gimnasioId)
    .not('fecha_vencimiento', 'is', null)
    .lt('fecha_vencimiento', hoy)
    .order('fecha_vencimiento', { ascending: true })

  const alumnos = (data ?? []).map(a => ({
    nombre: a.nombre_completo,
    fechaVencimiento: a.fecha_vencimiento!,
    diasVencida: Math.ceil(
      (hoyDate.getTime() - new Date(a.fecha_vencimiento! + 'T00:00:00').getTime()) / 86400000,
    ),
  }))

  return { total: alumnos.length, alumnos }
}

export async function getAlumnosConMembresiaProximaAVencer(gimnasioId: string, dias = 7) {
  const supabase = createAdminClient()
  const hoy = hoyAR()
  const hoyDate = new Date(hoy + 'T00:00:00')
  const hastaDate = new Date(hoyDate)
  hastaDate.setDate(hastaDate.getDate() + dias)
  const hasta = hastaDate.toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })

  const { data } = await supabase
    .from('alumnos')
    .select('id, nombre_completo, fecha_vencimiento')
    .eq('gimnasio_id', gimnasioId)
    .gte('fecha_vencimiento', hoy)
    .lte('fecha_vencimiento', hasta)
    .order('fecha_vencimiento', { ascending: true })

  const alumnos = (data ?? []).map(a => ({
    nombre: a.nombre_completo,
    fechaVencimiento: a.fecha_vencimiento!,
    diasRestantes: Math.ceil(
      (new Date(a.fecha_vencimiento! + 'T00:00:00').getTime() - hoyDate.getTime()) / 86400000,
    ),
  }))

  return { total: alumnos.length, alumnos, periodoConsultado: dias }
}

export async function getAlumnoResumen(gimnasioId: string, nombre: string) {
  const supabase = createAdminClient()
  const hoy = hoyAR()
  const hoyDate = new Date(hoy + 'T00:00:00')

  const { data: encontrados } = await supabase
    .from('alumnos')
    .select('id, nombre_completo, fecha_vencimiento')
    .eq('gimnasio_id', gimnasioId)
    .ilike('nombre_completo', `%${nombre}%`)
    .limit(5)

  if (!encontrados || encontrados.length === 0) {
    return { encontrado: false, mensaje: `No encontré ningún alumno con el nombre "${nombre}".` }
  }

  if (encontrados.length > 1) {
    return {
      encontrado: false,
      ambiguo: true,
      mensaje: `Encontré ${encontrados.length} alumnos con ese nombre. ¿A cuál te referís?`,
      opciones: encontrados.map(a => a.nombre_completo),
    }
  }

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
