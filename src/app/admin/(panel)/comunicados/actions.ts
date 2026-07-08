'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSession } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'
import { enviarPush } from '@/lib/onesignal'

export async function publicarComunicado(
  _prevState: { error: string | null; ok: boolean },
  formData: FormData
): Promise<{ error: string | null; ok: boolean }> {
  const titulo = (formData.get('titulo') as string)?.trim()
  const cuerpo = (formData.get('cuerpo') as string)?.trim()

  if (!titulo || !cuerpo) {
    return { error: 'Completá el título y el contenido.', ok: false }
  }

  const { gimnasioId } = await getAdminSession()
  const adminSupabase = createAdminClient()

  const { error } = await adminSupabase
    .from('comunicados')
    .insert({ titulo, cuerpo, gimnasio_id: gimnasioId })

  if (error) {
    return { error: error.message, ok: false }
  }

  await enviarPush({
    titulo: `📢 ${titulo}`,
    mensaje: cuerpo.length > 80 ? cuerpo.slice(0, 77) + '…' : cuerpo,
  })

  revalidatePath('/admin/comunicados')
  revalidatePath('/dashboard')
  return { error: null, ok: true }
}

export async function eliminarComunicado(id: string) {
  const { gimnasioId } = await getAdminSession()
  const adminSupabase = createAdminClient()
  await adminSupabase.from('comunicados').delete().eq('id', id).eq('gimnasio_id', gimnasioId)
  revalidatePath('/admin/comunicados')
  revalidatePath('/dashboard')
}
