import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getGymContext } from '@/lib/gym-context'
import { extraerFilas, extraerFilasCobros, matchearFilas, matchearFilasCobros, MappingImport } from '@/services/importar'

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
  const gimnasioId = gymAdmin.gimnasio_id

  // Catálogo para búsqueda manual en la UI de revisión
  const [{ data: alumnos }, { data: externos }] = await Promise.all([
    adminSupabase.from('alumnos').select('id, nombre_completo').eq('gimnasio_id', gimnasioId),
    adminSupabase.from('alumnos_externos').select('id, nombre_completo').eq('gimnasio_id', gimnasioId).is('alumno_id', null),
  ])
  const catalogo = [
    ...(alumnos ?? []).map(a => ({ id: a.id, nombre: a.nombre_completo, tipo: 'registrado' as const })),
    ...(externos ?? []).map(a => ({ id: a.id, nombre: a.nombre_completo, tipo: 'externo' as const })),
  ]

  if (mapping.tipo === 'cobros') {
    const filas = extraerFilasCobros(buffer, mapping)
    if (!filas.length) return NextResponse.json({ error: 'No se encontraron filas válidas con el mapeo indicado.' }, { status: 400 })
    const matches = await matchearFilasCobros(filas, gimnasioId)
    return NextResponse.json({ matches, catalogo })
  }

  const filas = extraerFilas(buffer, mapping)
  if (!filas.length) return NextResponse.json({ error: 'No se encontraron filas válidas con el mapeo indicado.' }, { status: 400 })
  const matches = await matchearFilas(filas, gimnasioId)
  return NextResponse.json({ matches, catalogo })
}
