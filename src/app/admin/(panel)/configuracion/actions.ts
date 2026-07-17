'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSession } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'

export async function guardarConfiguracion(
  _prevState: { error: string | null; ok: boolean },
  formData: FormData
): Promise<{ error: string | null; ok: boolean }> {
  const { gimnasioId } = await getAdminSession()
  const facebook_url = (formData.get('facebook_url') as string)?.trim() || null
  const instagram_url = (formData.get('instagram_url') as string)?.trim() || null
  const instagram_suplementos_url = (formData.get('instagram_suplementos_url') as string)?.trim() || null

  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase
    .from('configuracion')
    .upsert(
      { gimnasio_id: gimnasioId, facebook_url, instagram_url, instagram_suplementos_url },
      { onConflict: 'gimnasio_id' }
    )

  if (error) return { error: error.message, ok: false }

  revalidatePath('/dashboard')
  revalidatePath('/admin/configuracion')
  return { error: null, ok: true }
}

export async function guardarColores(
  _prevState: { error: string | null; ok: boolean },
  formData: FormData
): Promise<{ error: string | null; ok: boolean }> {
  const { gimnasioId } = await getAdminSession()
  const color_primario = (formData.get('color_primario') as string)?.trim() || null
  const color_acento = (formData.get('color_acento') as string)?.trim() || null

  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase
    .from('gimnasios')
    .update({ color_primario, color_acento })
    .eq('id', gimnasioId)

  if (error) return { error: error.message, ok: false }

  revalidatePath('/dashboard')
  revalidatePath('/admin/configuracion')
  return { error: null, ok: true }
}
