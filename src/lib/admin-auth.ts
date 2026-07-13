import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getGymContext } from '@/lib/gym-context'

export async function getAdminSession(): Promise<{ userId: string; gimnasioId: string; plan: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  const gym = await getGymContext()
  const adminSupabase = createAdminClient()
  const { data: gymAdmin } = await adminSupabase
    .from('gym_admins')
    .select('gimnasio_id')
    .eq('user_id', user.id)
    .eq('gimnasio_id', gym.id)
    .single()

  if (!gymAdmin) redirect('/admin/login')

  return { userId: user.id, gimnasioId: gymAdmin.gimnasio_id, plan: gym.plan }
}
