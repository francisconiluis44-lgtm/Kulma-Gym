'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getSuperadminSession } from '@/lib/superadmin-auth'
import { revalidatePath } from 'next/cache'

export async function agregarAdmin(
  _prevState: { error: string | null; ok: boolean },
  formData: FormData
): Promise<{ error: string | null; ok: boolean }> {
  await getSuperadminSession()

  const email = (formData.get('email') as string)?.trim()
  const gimnasioId = (formData.get('gimnasio_id') as string)?.trim()

  if (!email || !gimnasioId) return { error: 'Email requerido.', ok: false }

  const adminSupabase = createAdminClient()
  const { data: usersData } = await adminSupabase.auth.admin.listUsers()
  const targetUser = usersData?.users?.find((u) => u.email === email)

  if (!targetUser) return { error: 'No existe ningún usuario con ese email.', ok: false }

  const { error } = await adminSupabase
    .from('gym_admins')
    .insert({ user_id: targetUser.id, gimnasio_id: gimnasioId })

  if (error) {
    if (error.code === '23505') return { error: 'Ese usuario ya es admin de este gimnasio.', ok: false }
    return { error: error.message, ok: false }
  }

  revalidatePath(`/superadmin/gimnasios/${gimnasioId}`)
  return { error: null, ok: true }
}

export async function quitarAdmin(userId: string, gimnasioId: string) {
  await getSuperadminSession()
  const adminSupabase = createAdminClient()
  await adminSupabase.from('gym_admins').delete().eq('user_id', userId).eq('gimnasio_id', gimnasioId)
  revalidatePath(`/superadmin/gimnasios/${gimnasioId}`)
}

export async function actualizarTheming(
  _prevState: { error: string | null; ok: boolean },
  formData: FormData
): Promise<{ error: string | null; ok: boolean }> {
  await getSuperadminSession()

  const gimnasioId = (formData.get('gimnasio_id') as string)?.trim()
  const color_primario = (formData.get('color_primario') as string)?.trim()
  const color_acento = (formData.get('color_acento') as string)?.trim()
  const logo_url = (formData.get('logo_url') as string)?.trim() || null

  if (!gimnasioId) return { error: 'ID de gimnasio requerido.', ok: false }

  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase
    .from('gimnasios')
    .update({ color_primario, color_acento, logo_url })
    .eq('id', gimnasioId)

  if (error) return { error: error.message, ok: false }

  revalidatePath(`/superadmin/gimnasios/${gimnasioId}`)
  revalidatePath('/superadmin')
  return { error: null, ok: true }
}
