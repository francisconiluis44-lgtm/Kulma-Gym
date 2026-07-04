'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function actualizarAlumno(
  alumnoId: string,
  _prevState: { error: string | null; ok: boolean },
  formData: FormData
): Promise<{ error: string | null; ok: boolean }> {
  const rutina_url = (formData.get('rutina_url') as string)?.trim() || null
  const fecha_vencimiento = (formData.get('fecha_vencimiento') as string) || null
  const rutina_fecha_vencimiento = (formData.get('rutina_fecha_vencimiento') as string) || null

  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase
    .from('alumnos')
    .update({ rutina_url, fecha_vencimiento, rutina_fecha_vencimiento })
    .eq('id', alumnoId)

  if (error) {
    return { error: error.message, ok: false }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/membresias')
  revalidatePath(`/admin/alumnos/${alumnoId}`)
  return { error: null, ok: true }
}
