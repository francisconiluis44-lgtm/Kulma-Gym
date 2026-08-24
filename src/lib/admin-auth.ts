import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getGymContext } from '@/lib/gym-context'

export async function getAdminSession(): Promise<{ userId: string; gimnasioId: string; plan: string; rol: 'owner' | 'colaborador' }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  const gym = await getGymContext()
  const adminSupabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: gymAdmin } = await (adminSupabase as any)
    .from('gym_admins')
    .select('gimnasio_id, rol')
    .eq('user_id', user.id)
    .eq('gimnasio_id', gym.id)
    .single()

  if (!gymAdmin) redirect('/admin/login')

  const rol = (gymAdmin.rol === 'colaborador' ? 'colaborador' : 'owner') as 'owner' | 'colaborador'
  return { userId: user.id, gimnasioId: gymAdmin.gimnasio_id, plan: gym.plan, rol }
}
