'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSession } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'
import { enviarPush } from '@/lib/onesignal'

export async function responderMensaje(
  mensajeId: string,
  _prevState: { error: string | null; ok: boolean },
  formData: FormData
): Promise<{ error: string | null; ok: boolean }> {
  const respuesta = (formData.get('respuesta') as string)?.trim()
  if (!respuesta) return { error: 'Escribí una respuesta.', ok: false }

  const { gimnasioId } = await getAdminSession()
  const adminSupabase = createAdminClient()

  const { data: mensaje } = await adminSupabase
    .from('mensajes')
    .select('alumno_id')
    .eq('id', mensajeId)
    .eq('gimnasio_id', gimnasioId)
    .single()

  if (!mensaje) return { error: 'Mensaje no encontrado.', ok: false }

  const { error } = await adminSupabase
    .from('mensajes')
    .update({ respuesta, respondido_at: new Date().toISOString() })
    .eq('id', mensajeId)
    .eq('gimnasio_id', gimnasioId)

  if (error) return { error: error.message, ok: false }

  await enviarPush({
    titulo: 'Tu profe te respondió 💬',
    mensaje: respuesta.length > 80 ? respuesta.slice(0, 77) + '…' : respuesta,
    alumnoId: mensaje.alumno_id,
  })

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

  const { gimnasioId } = await getAdminSession()
  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase
    .from('mensajes_admin')
    .insert({ alumno_id, cuerpo, gimnasio_id: gimnasioId })

  if (error) return { error: error.message, ok: false }

  await enviarPush({
    titulo: 'Nuevo mensaje del profe 💬',
    mensaje: cuerpo.length > 80 ? cuerpo.slice(0, 77) + '…' : cuerpo,
    alumnoId: alumno_id,
  })

  revalidatePath('/admin/mensajes')
  return { error: null, ok: true }
}
