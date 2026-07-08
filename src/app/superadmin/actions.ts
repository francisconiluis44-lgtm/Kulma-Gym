'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getSuperadminSession } from '@/lib/superadmin-auth'
import { revalidatePath } from 'next/cache'

export async function toggleGimnasioActivo(id: string, activo: boolean) {
  await getSuperadminSession()
  const adminSupabase = createAdminClient()
  await adminSupabase.from('gimnasios').update({ activo }).eq('id', id)
  revalidatePath('/superadmin')
}
