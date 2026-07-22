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

  const now = new Date().toISOString()
  const timestamps: Record<string, string> = {}
  if (rutina_url !== anterior.rutina_url) timestamps.rutina_url_at = now
  if (rutina_fecha_vencimiento !== anterior.rutina_fecha_vencimiento) timestamps.rutina_venc_at = now
  if (fecha_vencimiento !== anterior.fecha_vencimiento) timestamps.membresia_at = now

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (adminSupabase.from('alumnos') as any)
    .update({ rutina_url, fecha_vencimiento, rutina_fecha_vencimiento, ...timestamps })
    .eq('id', alumnoId)
    .eq('gimnasio_id', gimnasioId)

  if (error) return { error: error.message, ok: false }

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

  revalidatePath('/admin')
  revalidatePath('/admin/membresias')
  revalidatePath(`/admin/alumnos/${alumnoId}`)
  return { error: null, ok: true }
}

function generateTempPassword(): string {
  // Avoids ambiguous chars (0/O, 1/l/I)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let result = ''
  for (let i = 0; i < 10; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

export async function resetearPasswordAlumno(
  alumnoId: string,
): Promise<{ password: string } | { error: string }> {
  const { gimnasioId } = await getAdminSession()
  const adminSupabase = createAdminClient()

  const { data: alumno } = await adminSupabase
    .from('alumnos')
    .select('id')
    .eq('id', alumnoId)
    .eq('gimnasio_id', gimnasioId)
    .single()

  if (!alumno) return { error: 'Alumno no encontrado' }

  const tempPassword = generateTempPassword()

  const { error: authError } = await adminSupabase.auth.admin.updateUserById(alumnoId, {
    password: tempPassword,
  })

  if (authError) return { error: authError.message }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (adminSupabase.from('alumnos') as any)
    .update({ must_change_password: true })
    .eq('id', alumnoId)

  return { password: tempPassword }
}

export async function subirRutinaPdf(
  alumnoId: string,
  formData: FormData
): Promise<{ error: string | null; url: string | null }> {
  const { gimnasioId } = await getAdminSession()
  const file = formData.get('pdf') as File | null

  if (!file || file.size === 0) return { error: 'No se seleccionó archivo', url: null }
  if (file.type !== 'application/pdf') return { error: 'Solo se permiten archivos PDF', url: null }
  if (file.size > 10 * 1024 * 1024) return { error: 'El archivo no puede superar los 10 MB', url: null }

  const adminSupabase = createAdminClient()
  const path = `${gimnasioId}/${alumnoId}.pdf`
  const arrayBuffer = await file.arrayBuffer()

  const { error } = await adminSupabase.storage
    .from('rutinas')
    .upload(path, arrayBuffer, { upsert: true, contentType: 'application/pdf' })

  if (error) return { error: error.message, url: null }

  const { data: { publicUrl } } = adminSupabase.storage.from('rutinas').getPublicUrl(path)
  // Versionar URL para que cada upload dispare el detector de cambios
  return { error: null, url: `${publicUrl}?v=${Date.now()}` }
}
