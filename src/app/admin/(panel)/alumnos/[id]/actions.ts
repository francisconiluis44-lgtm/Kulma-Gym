'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSession } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'
import { enviarPush } from '@/lib/onesignal'

export async function actualizarAlumno(
  alumnoId: string,
  _prevState: { error: string | null; ok: boolean },
  formData: FormData
): Promise<{ error: string | null; ok: boolean }> {
  const rutina_url = (formData.get('rutina_url') as string)?.trim() || null
  const fecha_vencimiento = (formData.get('fecha_vencimiento') as string) || null
  const rutina_fecha_vencimiento = (formData.get('rutina_fecha_vencimiento') as string) || null

  const { gimnasioId } = await getAdminSession()
  const adminSupabase = createAdminClient()

  const { data: anterior } = await adminSupabase
    .from('alumnos')
    .select('fecha_vencimiento, rutina_url, rutina_fecha_vencimiento')
    .eq('id', alumnoId)
    .eq('gimnasio_id', gimnasioId)
    .single()

  if (!anterior) return { error: 'Alumno no encontrado.', ok: false }

  const { error } = await adminSupabase
    .from('alumnos')
    .update({ rutina_url, fecha_vencimiento, rutina_fecha_vencimiento })
    .eq('id', alumnoId)
    .eq('gimnasio_id', gimnasioId)

  if (error) {
    return { error: error.message, ok: false }
  }

  if (anterior) {
    if (fecha_vencimiento !== anterior.fecha_vencimiento) {
      await enviarPush({
        titulo: '🏋️ Membresía actualizada',
        mensaje: fecha_vencimiento
          ? `Tu membresía fue renovada hasta el ${new Date(fecha_vencimiento + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'long' })}.`
          : 'Tu fecha de membresía fue actualizada.',
        alumnoId,
      })
    }

    const rutinaActualizada =
      rutina_url !== anterior.rutina_url ||
      rutina_fecha_vencimiento !== anterior.rutina_fecha_vencimiento

    if (rutinaActualizada && rutina_url) {
      await enviarPush({
        titulo: '📋 Nueva rutina disponible',
        mensaje: 'Tu profe actualizó tu rutina. Entrá al app para verla.',
        alumnoId,
      })
    }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/membresias')
  revalidatePath(`/admin/alumnos/${alumnoId}`)
  return { error: null, ok: true }
}
