'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSession } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'

export async function registrarCobro(params: {
  alumnoId: string
  monto: number
  fecha: string
  metodo: string
  notas?: string
  nuevaFechaVencimiento?: string
}): Promise<{ ok: true } | { error: string }> {
  const { gimnasioId } = await getAdminSession()
  const adminSupabase = createAdminClient()

  const { alumnoId, monto, fecha, metodo, notas, nuevaFechaVencimiento } = params

  const { data: alumno } = await adminSupabase
    .from('alumnos')
    .select('id')
    .eq('id', alumnoId)
    .eq('gimnasio_id', gimnasioId)
    .single()

  if (!alumno) return { error: 'Alumno no encontrado.' }

  const { error } = await adminSupabase
    .from('cobros')
    .insert({ alumno_id: alumnoId, gimnasio_id: gimnasioId, monto, fecha, metodo, notas: notas || null })

  if (error) return { error: 'Error al registrar el cobro.' }

  if (nuevaFechaVencimiento) {
    await adminSupabase
      .from('alumnos')
      .update({ fecha_vencimiento: nuevaFechaVencimiento })
      .eq('id', alumnoId)
  }

  revalidatePath(`/admin/alumnos/${alumnoId}`)
  revalidatePath('/admin/cobros')
  return { ok: true }
}
