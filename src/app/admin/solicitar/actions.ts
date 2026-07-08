'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getGymContext } from '@/lib/gym-context'

export async function solicitarAcceso(
  _prevState: { error: string | null; ok: boolean },
  formData: FormData
): Promise<{ error: string | null; ok: boolean }> {
  const nombre = (formData.get('nombre') as string)?.trim()
  const email = (formData.get('email') as string)?.trim()

  if (!nombre || !email) return { error: 'Completá todos los campos.', ok: false }

  const gym = await getGymContext()
  const adminSupabase = createAdminClient()

  const { error } = await adminSupabase
    .from('solicitudes_admin')
    .insert({ nombre, email, gimnasio_id: gym.id })

  if (error) return { error: error.message, ok: false }

  return { error: null, ok: true }
}
