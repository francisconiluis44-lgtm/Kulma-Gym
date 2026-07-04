'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function guardarConfiguracion(
  _prevState: { error: string | null; ok: boolean },
  formData: FormData
): Promise<{ error: string | null; ok: boolean }> {
  const facebook_url = (formData.get('facebook_url') as string)?.trim() || null
  const instagram_url = (formData.get('instagram_url') as string)?.trim() || null
  const instagram_suplementos_url = (formData.get('instagram_suplementos_url') as string)?.trim() || null

  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase
    .from('configuracion')
    .update({ facebook_url, instagram_url, instagram_suplementos_url })
    .eq('id', 1)

  if (error) return { error: error.message, ok: false }

  revalidatePath('/dashboard')
  revalidatePath('/admin/configuracion')
  return { error: null, ok: true }
}
