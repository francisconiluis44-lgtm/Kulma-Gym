'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getSuperadminSession } from '@/lib/superadmin-auth'
import { revalidatePath } from 'next/cache'

export async function crearGimnasio(
  _prevState: { error: string | null; ok: boolean },
  formData: FormData
): Promise<{ error: string | null; ok: boolean }> {
  await getSuperadminSession()

  const nombre = (formData.get('nombre') as string)?.trim()
  const slug = (formData.get('slug') as string)?.trim()
  const PLANES_VALIDOS = ['basico', 'pro', 'premium'] as const
  const planRaw = (formData.get('plan') as string)?.trim()
  const plan = (PLANES_VALIDOS as readonly string[]).includes(planRaw) ? planRaw : 'basico'
  const adminEmail = (formData.get('admin_email') as string)?.trim()

  if (!nombre || !slug) return { error: 'Nombre y slug son obligatorios.', ok: false }
  if (!/^[a-z0-9-]+$/.test(slug)) return { error: 'El slug solo puede tener minúsculas, números y guiones.', ok: false }

  const adminSupabase = createAdminClient()

  const { data: gym, error: gymError } = await adminSupabase
    .from('gimnasios')
    .insert({ nombre, slug, plan })
    .select('id')
    .single()

  if (gymError) {
    if (gymError.code === '23505') return { error: 'Ya existe un gimnasio con ese slug.', ok: false }
    return { error: gymError.message, ok: false }
  }

  if (adminEmail) {
    const { data: userData } = await adminSupabase.auth.admin.listUsers()
    const targetUser = userData?.users?.find((u) => u.email === adminEmail)
    if (targetUser) {
      await adminSupabase.from('gym_admins').insert({
        user_id: targetUser.id,
        gimnasio_id: gym.id,
      })
    }
  }

  revalidatePath('/superadmin')
  return { error: null, ok: true }
}
