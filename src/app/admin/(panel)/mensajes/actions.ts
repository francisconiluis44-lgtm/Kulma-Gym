'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { enviarPush } from '@/lib/onesignal'

export async function responderMensaje(
  mensajeId: string,
  _prevState: { error: string | null; ok: boolean },
  formData: FormData
): Promise<{ error: string | null; ok: boolean }> {
  const respuesta = (formData.get('respuesta') as string)?.trim()
  if (!respuesta) return { error: 'Escribí una respuesta.', ok: false }

  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase
    .from('mensajes')
    .update({ respuesta, respondido_at: new Date().toISOString() })
    .eq('id', mensajeId)

  if (error) return { error: error.message, ok: false }

  revalidatePath('/admin/mensajes')
  return { error: null, ok: true }
}

export async function enviarMensajeAAlumno(
  _prevState: { error: string | null; ok: boolean },
  formData: FormData
): Promise<{ error: string | null; ok: boolean }> {
  const alumno_id = (formData.get('alumno_id') as string)?.trim()
  const cuerpo = (formData.get('cuerpo') as string)?.trim()

  if (!alumno_id || !cuerpo) {
    return { error: 'Seleccioná un alumno y escribí el mensaje.', ok: false }
  }

  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase
    .from('mensajes_admin')
    .insert({ alumno_id, cuerpo })

  if (error) return { error: error.message, ok: false }

  await enviarPush({
    titulo: 'Nuevo mensaje del profe 💬',
    mensaje: cuerpo.length > 80 ? cuerpo.slice(0, 77) + '…' : cuerpo,
    alumnoId: alumno_id,
  })

  revalidatePath('/admin/mensajes')
  return { error: null, ok: true }
}
