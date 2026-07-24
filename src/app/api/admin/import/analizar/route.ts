import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getGymContext } from '@/lib/gym-context'
import { extraerFilas, matchearFilas, MappingImport } from '@/services/importar'

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
  const mappingStr = formData.get('mapping') as string | null
  if (!file) return NextResponse.json({ error: 'Archivo requerido.' }, { status: 400 })
  if (!mappingStr) return NextResponse.json({ error: 'Mapping requerido.' }, { status: 400 })

  let mapping: MappingImport
  try { mapping = JSON.parse(mappingStr) } catch {
    return NextResponse.json({ error: 'Mapping inválido.' }, { status: 400 })
  }

  const buffer = await file.arrayBuffer()
  const filas = extraerFilas(buffer, mapping)
  if (!filas.length) return NextResponse.json({ error: 'No se encontraron filas válidas con el mapeo indicado.' }, { status: 400 })

  const matches = await matchearFilas(filas, gymAdmin.gimnasio_id)
  return NextResponse.json({ matches })
}
