'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function actualizarDatosPerfil(
  _prevState: { error: string | null; ok: boolean },
  formData: FormData
): Promise<{ error: string | null; ok: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminSupabase = createAdminClient()

  const pesoRaw = formData.get('peso') as string
  const alturaRaw = formData.get('altura') as string

  const { error } = await adminSupabase
    .from('alumnos')
    .update({
      peso: pesoRaw ? parseFloat(pesoRaw) : null,
      altura: alturaRaw ? parseFloat(alturaRaw) : null,
      lesiones: (formData.get('lesiones') as string)?.trim() || null,
      objetivo: (formData.get('objetivo') as string) || null,
      fecha_nacimiento: (formData.get('fecha_nacimiento') as string) || null,
    })
    .eq('id', user.id)

  if (error) return { error: error.message, ok: false }

  revalidatePath('/perfil')
  return { error: null, ok: true }
}
