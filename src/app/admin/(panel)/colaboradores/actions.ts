'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSession } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'

export async function createColaborador(
  _prevState: { error?: string; ok?: true } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: true }> {
  const { gimnasioId, rol } = await getAdminSession()
  if (rol !== 'owner') return { error: 'Sin permisos.' }

  const email = (formData.get('email') as string | null)?.trim().toLowerCase()
  const password = formData.get('password') as string | null
  const nombre = (formData.get('nombre') as string | null)?.trim()

  if (!email || !password || !nombre) return { error: 'Completá todos los campos.' }
  if (password.length < 8) return { error: 'La contraseña debe tener al menos 8 caracteres.' }

  const adminSupabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = adminSupabase as any

  const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre_completo: nombre },
  })

  if (createError || !newUser?.user) {
    if (createError?.message?.includes('already registered')) {
      return { error: 'Ese email ya está registrado en el sistema.' }
    }
    return { error: createError?.message ?? 'Error al crear la cuenta.' }
  }

  const { error: insertError } = await sb.from('gym_admins').insert({
    user_id: newUser.user.id,
    gimnasio_id: gimnasioId,
    rol: 'colaborador',
  })

  if (insertError) {
    await adminSupabase.auth.admin.deleteUser(newUser.user.id)
    return { error: 'Error al agregar el colaborador.' }
  }

  revalidatePath('/admin/colaboradores')
  return { ok: true }
}

export async function removeColaborador(colaboradorUserId: string): Promise<{ error?: string; ok?: true }> {
  const { gimnasioId, userId, rol } = await getAdminSession()
  if (rol !== 'owner') return { error: 'Sin permisos.' }
  if (colaboradorUserId === userId) return { error: 'No podés eliminarte a vos mismo.' }

  const adminSupabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = adminSupabase as any

  // Verify target is a colaborador (not another owner) in this gym
  const { data: target } = await sb
    .from('gym_admins')
    .select('rol')
    .eq('user_id', colaboradorUserId)
    .eq('gimnasio_id', gimnasioId)
    .single()

  if (!target) return { error: 'Colaborador no encontrado.' }
  if (target.rol === 'owner') return { error: 'No podés eliminar a otro dueño.' }

  const { error: deleteRowError } = await sb
    .from('gym_admins')
    .delete()
    .eq('user_id', colaboradorUserId)
    .eq('gimnasio_id', gimnasioId)

  if (deleteRowError) return { error: 'Error al eliminar el colaborador.' }

  // Delete auth user only if they have no other gym memberships
  const { data: otherGyms } = await sb
    .from('gym_admins')
    .select('gimnasio_id')
    .eq('user_id', colaboradorUserId)

  if (!otherGyms || otherGyms.length === 0) {
    await adminSupabase.auth.admin.deleteUser(colaboradorUserId)
  }

  revalidatePath('/admin/colaboradores')
  return { ok: true }
}

export async function requireOwner() {
  const { rol } = await getAdminSession()
  if (rol !== 'owner') redirect('/admin')
}
