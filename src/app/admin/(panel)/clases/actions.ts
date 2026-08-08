'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin-auth'
import { canUse } from '@/lib/plan-features'
import { revalidatePath } from 'next/cache'

type Ok<T = void> = T extends void ? { ok: true } : { ok: true; data: T }
type Err = { error: string }
type Result<T = void> = Ok<T> | Err

// ─── Crear serie recurrente ────────────────────────────────────────────────
export async function crearSerie(formData: FormData): Promise<Result<{ serie_id: string }>> {
  const { gimnasioId, plan } = await getAdminSession()
  if (!canUse(plan, 'clases')) return { error: 'Plan no habilitado.' }

  const nombre          = (formData.get('nombre') as string)?.trim()
  const dia_semana      = parseInt(formData.get('dia_semana') as string, 10)
  const hora_inicio     = formData.get('hora_inicio') as string
  const duracion        = parseInt(formData.get('duracion_minutos') as string, 10)
  const cupo            = parseInt(formData.get('cupo_maximo') as string, 10)
  const instructor      = (formData.get('instructor') as string)?.trim()
  const descripcion     = (formData.get('descripcion') as string)?.trim() || null
  const fecha_desde     = formData.get('fecha_desde') as string

  if (!nombre)                                    return { error: 'El nombre es obligatorio.' }
  if (!dia_semana || dia_semana < 1 || dia_semana > 7) return { error: 'Día inválido.' }
  if (!hora_inicio)                               return { error: 'La hora es obligatoria.' }
  if (isNaN(duracion) || duracion <= 0)           return { error: 'Duración inválida.' }
  if (isNaN(cupo) || cupo <= 0)                   return { error: 'Cupo inválido.' }
  if (!instructor)                                return { error: 'El instructor es obligatorio.' }
  if (!fecha_desde)                               return { error: 'La fecha de inicio es obligatoria.' }

  const supabase = createAdminClient()

  const { data: serie, error: serieError } = await supabase
    .from('clases_series')
    .insert({ gimnasio_id: gimnasioId, nombre, activa: true })
    .select('id')
    .single()

  if (serieError || !serie) return { error: 'Error al crear la clase.' }

  const { error: versionError } = await supabase
    .from('clases_versiones')
    .insert({
      serie_id: serie.id,
      dia_semana,
      hora_inicio,
      duracion_minutos: duracion,
      cupo_maximo: cupo,
      instructor,
      descripcion,
      fecha_desde,
      fecha_hasta: null,
    })

  if (versionError) {
    await supabase.from('clases_series').delete().eq('id', serie.id)
    return { error: 'Error al guardar el horario. Verificá que no exista otra clase con el mismo día y rango de fechas.' }
  }

  revalidatePath('/admin/clases')
  revalidatePath('/admin/clases/horarios')
  return { ok: true, data: { serie_id: serie.id } }
}

// ─── Excepción: modificación de una ocurrencia ────────────────────────────
export async function crearExcepcionModificacion(
  serieId: string,
  fecha: string,
  overrides: {
    nombre?: string | null
    hora_inicio?: string | null
    duracion_minutos?: number | null
    cupo_maximo?: number | null
    instructor?: string | null
    descripcion?: string | null
  }
): Promise<Result> {
  const { gimnasioId, plan } = await getAdminSession()
  if (!canUse(plan, 'clases')) return { error: 'Plan no habilitado.' }

  // Verificar que al menos un campo tiene valor
  const tieneOverride = Object.values(overrides).some(v => v !== null && v !== undefined && v !== '')
  if (!tieneOverride) return { error: 'Debés modificar al menos un campo.' }

  const supabase = createAdminClient()

  const { data: serie } = await supabase
    .from('clases_series')
    .select('id')
    .eq('id', serieId)
    .eq('gimnasio_id', gimnasioId)
    .single()

  if (!serie) return { error: 'Serie no encontrada.' }

  const { error } = await supabase
    .from('clases_excepciones')
    .upsert(
      {
        gimnasio_id:      gimnasioId,
        serie_id:         serieId,
        fecha,
        tipo:             'modificacion',
        nombre:           overrides.nombre?.trim() || null,
        hora_inicio:      overrides.hora_inicio || null,
        duracion_minutos: overrides.duracion_minutos || null,
        cupo_maximo:      overrides.cupo_maximo || null,
        instructor:       overrides.instructor?.trim() || null,
        descripcion:      overrides.descripcion?.trim() || null,
      },
      { onConflict: 'serie_id,fecha' }
    )

  if (error) return { error: 'Error al guardar la modificación.' }

  revalidatePath('/admin/clases')
  return { ok: true }
}

// ─── Excepción: cancelar una ocurrencia ───────────────────────────────────
export async function cancelarOcurrencia(serieId: string, fecha: string): Promise<Result> {
  const { gimnasioId, plan } = await getAdminSession()
  if (!canUse(plan, 'clases')) return { error: 'Plan no habilitado.' }

  const supabase = createAdminClient()

  const { data: serie } = await supabase
    .from('clases_series')
    .select('id')
    .eq('id', serieId)
    .eq('gimnasio_id', gimnasioId)
    .single()

  if (!serie) return { error: 'Serie no encontrada.' }

  const { error } = await supabase
    .from('clases_excepciones')
    .upsert(
      {
        gimnasio_id:      gimnasioId,
        serie_id:         serieId,
        fecha,
        tipo:             'cancelacion',
        nombre:           null,
        hora_inicio:      null,
        duracion_minutos: null,
        cupo_maximo:      null,
        instructor:       null,
        descripcion:      null,
      },
      { onConflict: 'serie_id,fecha' }
    )

  if (error) return { error: 'Error al cancelar la clase.' }

  revalidatePath('/admin/clases')
  return { ok: true }
}

// ─── Clase especial (excepción sin serie) ─────────────────────────────────
export async function crearClaseEspecial(formData: FormData): Promise<Result> {
  const { gimnasioId, plan } = await getAdminSession()
  if (!canUse(plan, 'clases')) return { error: 'Plan no habilitado.' }

  const nombre      = (formData.get('nombre') as string)?.trim()
  const fecha       = formData.get('fecha') as string
  const hora_inicio = formData.get('hora_inicio') as string
  const duracion    = parseInt(formData.get('duracion_minutos') as string, 10)
  const cupo        = parseInt(formData.get('cupo_maximo') as string, 10)
  const instructor  = (formData.get('instructor') as string)?.trim()
  const descripcion = (formData.get('descripcion') as string)?.trim() || null

  if (!nombre)                          return { error: 'El nombre es obligatorio.' }
  if (!fecha)                           return { error: 'La fecha es obligatoria.' }
  if (!hora_inicio)                     return { error: 'La hora es obligatoria.' }
  if (isNaN(duracion) || duracion <= 0) return { error: 'Duración inválida.' }
  if (isNaN(cupo) || cupo <= 0)         return { error: 'Cupo inválido.' }
  if (!instructor)                      return { error: 'El instructor es obligatorio.' }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('clases_excepciones')
    .insert({
      gimnasio_id:      gimnasioId,
      serie_id:         null,
      fecha,
      tipo:             'clase_especial',
      nombre,
      hora_inicio,
      duracion_minutos: duracion,
      cupo_maximo:      cupo,
      instructor,
      descripcion,
    })

  if (error) return { error: 'Error al crear la clase especial.' }

  revalidatePath('/admin/clases')
  return { ok: true }
}

// ─── Cambio permanente de versión ─────────────────────────────────────────
export async function previewCambioPermanente(
  serieId: string,
  fechaDesde: string
): Promise<{ confirmadas: number } | Err> {
  const { gimnasioId } = await getAdminSession()
  const supabase = createAdminClient()

  const { data: serie } = await supabase
    .from('clases_series')
    .select('id')
    .eq('id', serieId)
    .eq('gimnasio_id', gimnasioId)
    .single()

  if (!serie) return { error: 'Serie no encontrada.' }

  const { count } = await supabase
    .from('clases_reservas')
    .select('*', { count: 'exact', head: true })
    .eq('serie_id', serieId)
    .gte('fecha_ocurrencia', fechaDesde)
    .eq('estado', 'confirmada')

  return { confirmadas: count ?? 0 }
}

export async function aplicarCambioPermanente(
  serieId: string,
  diaSemana: number,
  nuevaFechaDesde: string,
  datos: {
    hora_inicio: string
    duracion_minutos: number
    cupo_maximo: number
    instructor: string
    descripcion?: string | null
  }
): Promise<Result<{ reservas_afectadas: number }>> {
  const { plan } = await getAdminSession()
  if (!canUse(plan, 'clases')) return { error: 'Plan no habilitado.' }

  // Llamamos con el cliente de sesión del usuario para que auth.uid() esté
  // disponible dentro de cambio_permanente_version (verifica gym_admin).
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('cambio_permanente_version', {
    p_serie_id:          serieId,
    p_dia_semana:        diaSemana,
    p_nueva_fecha_desde: nuevaFechaDesde,
    p_hora_inicio:       datos.hora_inicio,
    p_duracion_minutos:  datos.duracion_minutos,
    p_cupo_maximo:       datos.cupo_maximo,
    p_instructor:        datos.instructor.trim(),
    p_descripcion:       datos.descripcion?.trim() || null,
  } as any)

  if (error) return { error: 'Error al aplicar el cambio.' }

  const res = data as unknown as { resultado: string; reservas_afectadas?: number; detalle?: string }

  if (res.resultado !== 'ok') {
    const msgs: Record<string, string> = {
      no_autenticado:               'Sesión expirada. Recargá la página.',
      sin_permiso:                  'No tenés permiso para modificar esta serie.',
      serie_no_encontrada:          'Serie no encontrada.',
      fecha_invalida:               'La fecha de inicio debe ser futura (no puede ser hoy ni pasada).',
      instructor_invalido:          'El instructor no puede estar vacío.',
      cupo_invalido:                'El cupo debe ser mayor a cero.',
      duracion_invalida:            'La duración debe ser mayor a cero.',
      version_activa_no_encontrada: 'No se encontró versión activa para este día.',
    }
    return { error: msgs[res.detalle ?? ''] ?? `Error inesperado: ${res.detalle}` }
  }

  revalidatePath('/admin/clases')
  revalidatePath('/admin/clases/horarios')
  return { ok: true, data: { reservas_afectadas: res.reservas_afectadas ?? 0 } }
}

// ─── Eliminar clase especial ───────────────────────────────────────────────
export async function cancelarClaseEspecial(excepcionId: string): Promise<Result> {
  const { gimnasioId, plan } = await getAdminSession()
  if (!canUse(plan, 'clases')) return { error: 'Plan no habilitado.' }

  const supabase = createAdminClient()

  const { data: ex } = await supabase
    .from('clases_excepciones')
    .select('id')
    .eq('id', excepcionId)
    .eq('gimnasio_id', gimnasioId)
    .eq('tipo', 'clase_especial')
    .single()

  if (!ex) return { error: 'Clase especial no encontrada.' }

  // Eliminar las reservas primero (la FK impide borrar la excepción si existen)
  // Los eventos de reserva también se eliminan por CASCADE desde clases_reservas.
  await supabase.from('clases_reservas').delete().eq('excepcion_id', excepcionId)

  const { error } = await supabase
    .from('clases_excepciones')
    .delete()
    .eq('id', excepcionId)

  if (error) return { error: 'Error al eliminar la clase especial.' }

  revalidatePath('/admin/clases')
  return { ok: true }
}

// ─── Inscriptos de una ocurrencia ─────────────────────────────────────────
export async function getInscriptos(
  serieId: string | null,
  excepcionId: string | null,
  fecha: string | null
): Promise<{ alumnos: { id: string; nombre_completo: string; whatsapp: string | null }[] } | Err> {
  const { gimnasioId } = await getAdminSession()
  const supabase = createAdminClient()

  let reservasQuery = supabase
    .from('clases_reservas')
    .select('alumno_id')
    .eq('gimnasio_id', gimnasioId)
    .eq('estado', 'confirmada')

  if (serieId && fecha) {
    reservasQuery = reservasQuery.eq('serie_id', serieId).eq('fecha_ocurrencia', fecha)
  } else if (excepcionId) {
    reservasQuery = reservasQuery.eq('excepcion_id', excepcionId)
  } else {
    return { error: 'Parámetros inválidos.' }
  }

  const { data: reservas, error: resError } = await reservasQuery
  if (resError) return { error: 'Error al cargar inscriptos.' }

  const ids = (reservas ?? []).map(r => r.alumno_id)
  if (ids.length === 0) return { alumnos: [] }

  const { data: alumnos, error: alnError } = await supabase
    .from('alumnos')
    .select('id, nombre_completo, whatsapp')
    .in('id', ids)
    .order('nombre_completo')

  if (alnError) return { error: 'Error al cargar datos de alumnos.' }

  return { alumnos: alumnos ?? [] }
}

// ─── Editar versión activa (horarios habituales) ──────────────────────────
export async function editarVersionHorario(
  versionId: string,
  datos: {
    nombre: string
    hora_inicio: string
    duracion_minutos: number
    cupo_maximo: number
    instructor: string
    descripcion: string | null
  }
): Promise<Result> {
  const { gimnasioId, plan } = await getAdminSession()
  if (!canUse(plan, 'clases')) return { error: 'Plan no habilitado.' }

  if (!datos.nombre.trim())      return { error: 'El nombre es obligatorio.' }
  if (!datos.hora_inicio)        return { error: 'La hora es obligatoria.' }
  if (datos.duracion_minutos <= 0) return { error: 'Duración inválida.' }
  if (datos.cupo_maximo <= 0)    return { error: 'Cupo inválido.' }
  if (!datos.instructor.trim())  return { error: 'El instructor es obligatorio.' }

  const supabase = createAdminClient()

  const { data: version } = await supabase
    .from('clases_versiones')
    .select('id, serie_id')
    .eq('id', versionId)
    .single()

  if (!version) return { error: 'Clase no encontrada.' }

  const { data: serie } = await supabase
    .from('clases_series')
    .select('id')
    .eq('id', version.serie_id)
    .eq('gimnasio_id', gimnasioId)
    .single()

  if (!serie) return { error: 'Clase no encontrada.' }

  const { error: serieError } = await supabase
    .from('clases_series')
    .update({ nombre: datos.nombre.trim() })
    .eq('id', version.serie_id)

  if (serieError) return { error: 'Error al actualizar el nombre.' }

  const { error: versionError } = await supabase
    .from('clases_versiones')
    .update({
      hora_inicio:       datos.hora_inicio,
      duracion_minutos:  datos.duracion_minutos,
      cupo_maximo:       datos.cupo_maximo,
      instructor:        datos.instructor.trim(),
      descripcion:       datos.descripcion?.trim() || null,
    })
    .eq('id', versionId)

  if (versionError) return { error: 'Error al actualizar el horario.' }

  revalidatePath('/admin/clases')
  revalidatePath('/admin/clases/horarios')
  return { ok: true }
}

// ─── Eliminar clase habitual (desactiva serie + cancela reservas futuras) ──
export async function desactivarSerie(serieId: string): Promise<Result> {
  const { gimnasioId, plan } = await getAdminSession()
  if (!canUse(plan, 'clases')) return { error: 'Plan no habilitado.' }

  const supabase = createAdminClient()

  const { data: serie } = await supabase
    .from('clases_series')
    .select('id')
    .eq('id', serieId)
    .eq('gimnasio_id', gimnasioId)
    .single()

  if (!serie) return { error: 'Clase no encontrada.' }

  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })

  // Cerrar versiones activas (fecha_hasta = ayer)
  const ayerDate = new Date(hoy + 'T00:00:00')
  ayerDate.setDate(ayerDate.getDate() - 1)
  const ayer = ayerDate.toISOString().slice(0, 10)

  await supabase
    .from('clases_versiones')
    .update({ fecha_hasta: ayer })
    .eq('serie_id', serieId)
    .is('fecha_hasta', null)

  // Cancelar reservas futuras confirmadas
  await supabase
    .from('clases_reservas')
    .update({ estado: 'cancelada' })
    .eq('serie_id', serieId)
    .eq('estado', 'confirmada')
    .gte('fecha_ocurrencia', hoy)

  // Desactivar la serie
  const { error } = await supabase
    .from('clases_series')
    .update({ activa: false })
    .eq('id', serieId)

  if (error) return { error: 'Error al eliminar la clase.' }

  revalidatePath('/admin/clases')
  revalidatePath('/admin/clases/horarios')
  return { ok: true }
}

// ─── Legado (migration 026) — mantener para no romper build ───────────────
export async function crearClase(formData: FormData): Promise<{ ok: true; id: string } | { error: string }> {
  const { gimnasioId, plan } = await getAdminSession()
  if (!canUse(plan, 'clases')) return { error: 'Plan no habilitado.' }
  const titulo        = (formData.get('titulo') as string).trim()
  const instructor    = (formData.get('instructor') as string).trim()
  const fechaHoraLocal = formData.get('fecha_hora') as string
  const duracion_min  = parseInt(formData.get('duracion_min') as string, 10)
  const capacidad_max = parseInt(formData.get('capacidad_max') as string, 10)
  const descripcion   = (formData.get('descripcion') as string).trim()
  if (!titulo || !fechaHoraLocal) return { error: 'Título y fecha/hora son obligatorios.' }
  const fechaHoraUTC = new Date(fechaHoraLocal + ':00-03:00').toISOString()
  const adminSupabase = createAdminClient()
  const { data, error } = await adminSupabase
    .from('clases')
    .insert({ gimnasio_id: gimnasioId, titulo, instructor: instructor || null,
      fecha_hora: fechaHoraUTC, duracion_min: isNaN(duracion_min) ? 60 : duracion_min,
      capacidad_max: isNaN(capacidad_max) ? 20 : capacidad_max, descripcion: descripcion || null })
    .select('id').single()
  if (error) return { error: 'Error al crear la clase.' }
  revalidatePath('/admin/clases')
  return { ok: true, id: data.id }
}

export async function cancelarClase(claseId: string): Promise<{ ok: true } | { error: string }> {
  const { gimnasioId } = await getAdminSession()
  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase
    .from('clases').update({ cancelada: true }).eq('id', claseId).eq('gimnasio_id', gimnasioId)
  if (error) return { error: 'Error al cancelar la clase.' }
  revalidatePath('/admin/clases')
  revalidatePath(`/admin/clases/${claseId}`)
  return { ok: true }
}
