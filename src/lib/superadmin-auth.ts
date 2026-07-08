import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function getSuperadminSession(): Promise<{ userId: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  const adminSupabase = createAdminClient()
  const { data: superadmin } = await adminSupabase
    .from('superadmins')
    .select('user_id')
    .eq('user_id', user.id)
    .single()

  if (!superadmin) redirect('/admin/login')

  return { userId: user.id }
}
