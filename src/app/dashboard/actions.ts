'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { notificarAdmin } from '@/lib/onesignal'
import { getGymContext } from '@/lib/gym-context'

async function verificarMembresiaGym(userId: string, gymId: string): Promise<boolean> {
  const adminSupabase = createAdminClient()
  const { data } = await adminSupabase
    .from('alumnos')
    .select('id')
    .eq('id', userId)
    .eq('gimnasio_id', gymId)
    .single()
  return !!data
}

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

  const gym = await getGymContext()

  if (!await verificarMembresiaGym(user.id, gym.id)) {
    return { error: 'No sos alumno de este gimnasio.', ok: false }
  }

  const { data: comunicado } = await supabase
    .from('comunicados')
    .select('id')
    .eq('id', comunicadoId)
    .eq('gimnasio_id', gym.id)
    .single()

  if (!comunicado) return { error: 'Comunicado no encontrado.', ok: false }

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

  if (!await verificarMembresiaGym(user.id, gym.id)) {
    return { error: 'No sos alumno de este gimnasio.', ok: false }
  }

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
