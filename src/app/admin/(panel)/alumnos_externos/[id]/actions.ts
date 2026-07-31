'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSession } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'

export async function actualizarFechaVencimientoExterno(
  externoId: string,
  fechaVencimiento: string | null,
): Promise<{ ok: true } | { error: string }> {
  const { gimnasioId } = await getAdminSession()
  const adminSupabase = createAdminClient()

  const { data: externo } = await adminSupabase
    .from('alumnos_externos')
    .select('id')
    .eq('id', externoId)
    .eq('gimnasio_id', gimnasioId)
    .single()

  if (!externo) return { error: 'Alumno no encontrado.' }

  const { error } = await adminSupabase
    .from('alumnos_externos')
    .update({ fecha_vencimiento: fechaVencimiento })
    .eq('id', externoId)
    .eq('gimnasio_id', gimnasioId)

  if (error) return { error: 'Error al actualizar la fecha.' }

  revalidatePath(`/admin/alumnos_externos/${externoId}`)
  revalidatePath('/admin/alumnos')
  revalidatePath('/admin/membresias')
  return { ok: true }
}

export async function actualizarContactoExterno(
  externoId: string,
  whatsapp: string | null,
  email: string | null,
): Promise<{ ok: true } | { error: string }> {
  const { gimnasioId } = await getAdminSession()
  const adminSupabase = createAdminClient()

  const { data: externo } = await adminSupabase
    .from('alumnos_externos')
    .select('id')
    .eq('id', externoId)
    .eq('gimnasio_id', gimnasioId)
    .single()

  if (!externo) return { error: 'Alumno no encontrado.' }

  const { error } = await adminSupabase
    .from('alumnos_externos')
    .update({ whatsapp: whatsapp || null, email: email || null })
    .eq('id', externoId)
    .eq('gimnasio_id', gimnasioId)

  if (error) return { error: 'Error al actualizar el contacto.' }

  revalidatePath(`/admin/alumnos_externos/${externoId}`)
  return { ok: true }
}

export async function registrarCobroExterno(params: {
  externoId: string
  monto: number
  fecha: string
  metodo: string
  notas?: string
  nuevaFechaVencimiento?: string
}): Promise<{ ok: true } | { error: string }> {
  const { gimnasioId } = await getAdminSession()
  const adminSupabase = createAdminClient()

  const { externoId, monto, fecha, metodo, notas, nuevaFechaVencimiento } = params

  const { data: externo } = await adminSupabase
    .from('alumnos_externos')
    .select('id')
    .eq('id', externoId)
    .eq('gimnasio_id', gimnasioId)
    .single()

  if (!externo) return { error: 'Alumno no encontrado.' }

  const { error } = await adminSupabase
    .from('cobros_externos')
    .insert({
      alumno_externo_id: externoId,
      gimnasio_id: gimnasioId,
      monto,
      fecha,
      metodo,
      notas: notas || null,
    })

  if (error) return { error: 'Error al registrar el cobro.' }

  if (nuevaFechaVencimiento) {
    await adminSupabase
      .from('alumnos_externos')
      .update({ fecha_vencimiento: nuevaFechaVencimiento })
      .eq('id', externoId)
      .eq('gimnasio_id', gimnasioId)
  }

  revalidatePath(`/admin/alumnos_externos/${externoId}`)
  revalidatePath('/admin/cobros')
  revalidatePath('/admin')
  return { ok: true }
}

export async function buscarAlumnosRegistrados(): Promise<{ id: string; nombre: string }[]> {
  const { gimnasioId } = await getAdminSession()
  const adminSupabase = createAdminClient()
  const { data } = await adminSupabase
    .from('alumnos')
    .select('id, nombre_completo')
    .eq('gimnasio_id', gimnasioId)
    .order('nombre_completo')
  return (data ?? []).map(a => ({ id: a.id, nombre: a.nombre_completo }))
}

export async function vincularAlumnoExterno(
  externoId: string,
  alumnoId: string,
): Promise<{ ok: true } | { error: string }> {
  const { gimnasioId } = await getAdminSession()
  const adminSupabase = createAdminClient()

  const [{ data: externo }, { data: alumno }] = await Promise.all([
    adminSupabase.from('alumnos_externos').select('id').eq('id', externoId).eq('gimnasio_id', gimnasioId).single(),
    adminSupabase.from('alumnos').select('id').eq('id', alumnoId).eq('gimnasio_id', gimnasioId).single(),
  ])

  if (!externo) return { error: 'Alumno no encontrado.' }
  if (!alumno) return { error: 'Alumno con cuenta no encontrado.' }

  const { error } = await adminSupabase
    .from('alumnos_externos')
    .update({ alumno_id: alumnoId })
    .eq('id', externoId)
    .eq('gimnasio_id', gimnasioId)

  if (error) return { error: 'Error al vincular.' }

  revalidatePath(`/admin/alumnos_externos/${externoId}`)
  revalidatePath('/admin/alumnos')
  return { ok: true }
}

export async function desvincularAlumnoExterno(
  externoId: string,
): Promise<{ ok: true } | { error: string }> {
  const { gimnasioId } = await getAdminSession()
  const adminSupabase = createAdminClient()

  const { error } = await adminSupabase
    .from('alumnos_externos')
    .update({ alumno_id: null })
    .eq('id', externoId)
    .eq('gimnasio_id', gimnasioId)

  if (error) return { error: 'Error al desvincular.' }

  revalidatePath(`/admin/alumnos_externos/${externoId}`)
  revalidatePath('/admin/alumnos')
  return { ok: true }
}
