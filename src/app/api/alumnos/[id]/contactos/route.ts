import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getGymContext } from '@/lib/gym-context'
import { registrarContacto, getContactosAlumno, type MotivoContacto, type CanalContacto, type ResultadoContacto } from '@/services/contactos'

export const dynamic = 'force-dynamic'

const MOTIVOS_VALIDOS: MotivoContacto[] = ['renovacion_vencida', 'reactivacion', 'por_vencer', 'otro']
const CANALES_VALIDOS: CanalContacto[] = ['whatsapp', 'llamada', 'presencial', 'email', 'otro']
const RESULTADOS_VALIDOS: ResultadoContacto[] = ['pendiente', 'sin_respuesta', 'respondio', 'renovo', 'rechazo', 'contactar_mas_adelante']

async function getAuth(alumnoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const gym = await getGymContext()
  const adminSupabase = createAdminClient()

  const [{ data: gymAdmin }, { data: alumno }] = await Promise.all([
    adminSupabase.from('gym_admins').select('gimnasio_id').eq('user_id', user.id).eq('gimnasio_id', gym.id).single(),
    adminSupabase.from('alumnos').select('id').eq('id', alumnoId).eq('gimnasio_id', gym.id).single(),
  ])

  if (!gymAdmin || !alumno) return null
  return { userId: user.id, gimnasioId: gymAdmin.gimnasio_id }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await getAuth(id)
  if (!auth) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const contactos = await getContactosAlumno(auth.gimnasioId, id)
  return NextResponse.json({ contactos })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await getAuth(id)
  if (!auth) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const { motivo, canal, resultado, observacion } = body ?? {}

  if (!MOTIVOS_VALIDOS.includes(motivo)) return NextResponse.json({ error: 'Motivo inválido.' }, { status: 400 })
  if (!CANALES_VALIDOS.includes(canal)) return NextResponse.json({ error: 'Canal inválido.' }, { status: 400 })
  if (!RESULTADOS_VALIDOS.includes(resultado)) return NextResponse.json({ error: 'Resultado inválido.' }, { status: 400 })

  const data = await registrarContacto({
    gimnasioId: auth.gimnasioId,
    alumnoId: id,
    usuarioId: auth.userId,
    motivo,
    canal,
    resultado,
    observacion: typeof observacion === 'string' ? observacion.slice(0, 500) : undefined,
  })

  return NextResponse.json({ id: data.id }, { status: 201 })
}
