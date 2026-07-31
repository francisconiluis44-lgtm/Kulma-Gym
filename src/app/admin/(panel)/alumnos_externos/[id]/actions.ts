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
