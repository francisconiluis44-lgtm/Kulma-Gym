import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function getGaleriaSession(): Promise<{ userId: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/galeria/login')

  return { userId: user.id }
}
