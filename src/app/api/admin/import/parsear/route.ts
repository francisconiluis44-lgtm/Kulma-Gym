import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getGymContext } from '@/lib/gym-context'
import { parsearExcel } from '@/services/importar'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const gym = await getGymContext()
  const adminSupabase = createAdminClient()
  const { data: gymAdmin } = await adminSupabase
    .from('gym_admins').select('gimnasio_id')
    .eq('user_id', user.id).eq('gimnasio_id', gym.id).single()
  if (!gymAdmin) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Archivo requerido.' }, { status: 400 })

  const buffer = await file.arrayBuffer()
  const parsed = parsearExcel(buffer)
  return NextResponse.json(parsed)
}
