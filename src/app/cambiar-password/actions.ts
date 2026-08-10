'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function clearMustChangePassword() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const adminSupabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (adminSupabase.from('alumnos') as any)
    .update({ must_change_password: false })
    .eq('id', user.id)
}

// Use admin client so the change takes effect immediately, bypassing
// Supabase's "Secure password change" email-confirmation flow which
// would silently fail on fake gym-domain addresses.
export async function cambiarPassword(
  newPassword: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión no encontrada. Volvé a iniciar sesión.' }

  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase.auth.admin.updateUserById(user.id, {
    password: newPassword,
    email_confirm: true,
  })

  if (error) return { error: error.message }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (adminSupabase.from('alumnos') as any)
    .update({ must_change_password: false })
    .eq('id', user.id)

  return { error: null }
}
