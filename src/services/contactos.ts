import { createAdminClient } from '@/lib/supabase/admin'

export type MotivoContacto = 'renovacion_vencida' | 'reactivacion' | 'por_vencer' | 'otro'
export type CanalContacto = 'whatsapp' | 'llamada' | 'presencial' | 'email' | 'otro'
export type ResultadoContacto = 'pendiente' | 'sin_respuesta' | 'respondio' | 'renovo' | 'rechazo' | 'contactar_mas_adelante'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tabla = (supabase: ReturnType<typeof createAdminClient>) => (supabase as any).from('contactos_alumnos')

function hoyAR() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
}

export async function registrarContacto(params: {
  gimnasioId: string
  alumnoId: string
  usuarioId: string
  motivo: MotivoContacto
  canal: CanalContacto
  resultado: ResultadoContacto
  observacion?: string
  fechaContacto?: string
}) {
  const supabase = createAdminClient()
  const { data, error } = await tabla(supabase)
    .insert({
      gimnasio_id: params.gimnasioId,
      alumno_id: params.alumnoId,
      usuario_id: params.usuarioId,
      motivo: params.motivo,
      canal: params.canal,
      resultado: params.resultado,
      observacion: params.observacion ?? null,
      fecha_contacto: params.fechaContacto ?? hoyAR(),
      fecha_resultado: params.resultado !== 'pendiente' ? hoyAR() : null,
    })
    .select('id')
    .single()

  if (error) throw error
  return data as { id: string }
}

export async function getContactosAlumno(gimnasioId: string, alumnoId: string) {
  const supabase = createAdminClient()
  const { data, error } = await tabla(supabase)
    .select('id, motivo, canal, fecha_contacto, resultado, fecha_resultado, observacion')
    .eq('gimnasio_id', gimnasioId)
    .eq('alumno_id', alumnoId)
    .order('fecha_contacto', { ascending: false })
    .limit(20)

  if (error) throw error
  return (data ?? []) as {
    id: string
    motivo: MotivoContacto
    canal: CanalContacto
    fecha_contacto: string
    resultado: ResultadoContacto
    fecha_resultado: string | null
    observacion: string | null
  }[]
}

export async function getHistorialContactos(gimnasioId: string) {
  const supabase = createAdminClient()
  const hace30d = new Date()
  hace30d.setDate(hace30d.getDate() - 30)
  const desde = hace30d.toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })

  const { data: contactos } = await tabla(supabase)
    .select('alumno_id, motivo, canal, resultado, fecha_contacto, observacion')
    .eq('gimnasio_id', gimnasioId)
    .gte('fecha_contacto', desde)
    .order('fecha_contacto', { ascending: false })
    .limit(100)

  const rows = (contactos ?? []) as {
    alumno_id: string
    motivo: MotivoContacto
    canal: CanalContacto
    resultado: ResultadoContacto
    fecha_contacto: string
    observacion: string | null
  }[]

  if (rows.length === 0) return { periodo: '30 días', contactos: [], total: 0 }

  // Get alumno names
  const ids = [...new Set(rows.map(r => r.alumno_id))]
  const { data: alumnos } = await supabase
    .from('alumnos')
    .select('id, nombre_completo')
    .in('id', ids)
    .eq('gimnasio_id', gimnasioId)

  const nombreMap = new Map((alumnos ?? []).map(a => [a.id, a.nombre_completo]))

  return {
    periodo: '30 días',
    total: rows.length,
    contactos: rows.map(r => ({
      alumno: nombreMap.get(r.alumno_id) ?? 'Desconocido',
      motivo: r.motivo,
      canal: r.canal,
      resultado: r.resultado,
      fecha: r.fecha_contacto,
      observacion: r.observacion ?? undefined,
    })),
  }
}

export async function getResumenContactos(gimnasioId: string) {
  const supabase = createAdminClient()
  const hace30d = new Date()
  hace30d.setDate(hace30d.getDate() - 30)
  const desde = hace30d.toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })

  const { data } = await tabla(supabase)
    .select('resultado, motivo')
    .eq('gimnasio_id', gimnasioId)
    .gte('fecha_contacto', desde)

  const rows = (data ?? []) as { resultado: ResultadoContacto; motivo: MotivoContacto }[]
  const total = rows.length
  const renovaron = rows.filter(c => c.resultado === 'renovo').length
  const sinRespuesta = rows.filter(c => c.resultado === 'sin_respuesta').length
  const rechazaron = rows.filter(c => c.resultado === 'rechazo').length
  const tasaConversion = total > 0 ? Math.round((renovaron / total) * 100) : null

  return {
    periodo: '30 días',
    totalContactos: total,
    renovaron,
    sinRespuesta,
    rechazaron,
    tasaConversionReal: tasaConversion !== null ? `${tasaConversion}%` : 'Sin datos suficientes',
  }
}
