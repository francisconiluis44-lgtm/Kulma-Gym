'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSession } from '@/lib/admin-auth'
import { canUse } from '@/lib/plan-features'
import { revalidatePath } from 'next/cache'

export async function crearClase(formData: FormData): Promise<{ ok: true; id: string } | { error: string }> {
  const { gimnasioId, plan } = await getAdminSession()
  if (!canUse(plan, 'clases')) return { error: 'Plan no habilitado.' }

  const titulo = (formData.get('titulo') as string).trim()
  const instructor = (formData.get('instructor') as string).trim()
  const fechaHoraLocal = formData.get('fecha_hora') as string
  const duracion_min = parseInt(formData.get('duracion_min') as string, 10)
  const capacidad_max = parseInt(formData.get('capacidad_max') as string, 10)
  const descripcion = (formData.get('descripcion') as string).trim()

  if (!titulo || !fechaHoraLocal) return { error: 'Título y fecha/hora son obligatorios.' }

  // datetime-local gives "YYYY-MM-DDTHH:mm" in local time; Argentina is UTC-3 (sin DST)
  const fechaHoraUTC = new Date(fechaHoraLocal + ':00-03:00').toISOString()

  const adminSupabase = createAdminClient()
  const { data, error } = await adminSupabase
    .from('clases')
    .insert({
      gimnasio_id: gimnasioId,
      titulo,
      instructor: instructor || null,
      fecha_hora: fechaHoraUTC,
      duracion_min: isNaN(duracion_min) ? 60 : duracion_min,
      capacidad_max: isNaN(capacidad_max) ? 20 : capacidad_max,
      descripcion: descripcion || null,
    })
    .select('id')
    .single()

  if (error) return { error: 'Error al crear la clase.' }
  revalidatePath('/admin/clases')
  return { ok: true, id: data.id }
}

export async function cancelarClase(claseId: string): Promise<{ ok: true } | { error: string }> {
  const { gimnasioId } = await getAdminSession()
  const adminSupabase = createAdminClient()

  const { error } = await adminSupabase
    .from('clases')
    .update({ cancelada: true })
    .eq('id', claseId)
    .eq('gimnasio_id', gimnasioId)

  if (error) return { error: 'Error al cancelar la clase.' }
  revalidatePath('/admin/clases')
  revalidatePath(`/admin/clases/${claseId}`)
  return { ok: true }
}
