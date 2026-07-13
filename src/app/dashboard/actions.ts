'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { notificarAdmin } from '@/lib/onesignal'
import { getGymContext } from '@/lib/gym-context'

export async function enviarComentario(
  comunicadoId: string,
  _prevState: { error: string | null; ok: boolean },
  formData: FormData
): Promise<{ error: string | null; ok: boolean }> {
  const cuerpo = (formData.get('cuerpo') as string)?.trim()
  if (!cuerpo) return { error: 'Escribí algo antes de enviar.', ok: false }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.', ok: false }

  const { error } = await supabase.from('comentarios').insert({
    comunicado_id: comunicadoId,
    alumno_id: user.id,
    cuerpo,
  })

  if (error) return { error: error.message, ok: false }

  revalidatePath('/dashboard')
  return { error: null, ok: true }
}

export async function enviarMensaje(
  _prevState: { error: string | null; ok: boolean },
  formData: FormData
): Promise<{ error: string | null; ok: boolean }> {
  const cuerpo = (formData.get('cuerpo') as string)?.trim()
  if (!cuerpo) return { error: 'Escribí algo antes de enviar.', ok: false }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.', ok: false }

  const gym = await getGymContext()

  const { error } = await supabase.from('mensajes').insert({
    alumno_id: user.id,
    cuerpo,
    gimnasio_id: gym.id,
  })

  if (error) return { error: error.message, ok: false }

  await notificarAdmin(
    gym.id,
    '💬 Mensaje de un alumno',
    cuerpo.length > 80 ? cuerpo.slice(0, 77) + '…' : cuerpo
  )

  revalidatePath('/dashboard')
  return { error: null, ok: true }
}
