import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function getAdminSession(): Promise<{ userId: string; gimnasioId: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  const adminSupabase = createAdminClient()
  const { data: gymAdmin } = await adminSupabase
    .from('gym_admins')
    .select('gimnasio_id')
    .eq('user_id', user.id)
    .single()

  if (!gymAdmin) redirect('/admin/login')

  return { userId: user.id, gimnasioId: gymAdmin.gimnasio_id }
}
