'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function clearMustChangePassword() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const adminSupabase = createAdminClient()
  await adminSupabase
    .from('alumnos')
    .update({ must_change_password: false })
    .eq('id', user.id)
}
