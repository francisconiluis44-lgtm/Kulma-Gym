import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { studentEmailDomain } from '@/lib/gym-context'
import { notificarAdmin } from '@/lib/onesignal'
import { getAlumnosLimit } from '@/lib/plan-features'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { nombre_completo, dni, whatsapp, email, fecha_nacimiento, password } =
    await request.json()

  if (!nombre_completo || !dni || !whatsapp || !password) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  const headersList = await headers()
  const slug = headersList.get('x-gym-slug') ?? 'kulma-gym'
  const emailDomain = studentEmailDomain(slug)

  const adminSupabase = createAdminClient()

  // Resolve gym ID and plan
  const { data: gym } = await adminSupabase
    .from('gimnasios')
    .select('id, plan')
    .eq('slug', slug)
    .single()
  const gimnasioId = gym?.id ?? '00000000-0000-0000-0000-000000000001'

  // Enforce plan alumno limit
  const limit = getAlumnosLimit(gym?.plan ?? 'basico')
  if (isFinite(limit)) {
    const { count } = await adminSupabase
      .from('alumnos')
      .select('*', { count: 'exact', head: true })
      .eq('gimnasio_id', gimnasioId)
    if ((count ?? 0) >= limit) {
      return NextResponse.json(
        { error: `Tu gimnasio alcanzó el límite de ${limit} alumnos del plan actual.` },
        { status: 403 }
      )
    }
  }

  const { error } = await adminSupabase.auth.admin.createUser({
    email: `${dni.trim()}@${emailDomain}`,
    password,
    email_confirm: true,
    user_metadata: {
      nombre_completo: nombre_completo.trim(),
      dni: dni.trim(),
      whatsapp: whatsapp.trim(),
      email: email?.trim() ?? '',
      fecha_nacimiento: fecha_nacimiento ?? '',
      gimnasio_id: gimnasioId,
    },
  })

  if (error) {
    if (
      error.message.toLowerCase().includes('already registered') ||
      error.message.toLowerCase().includes('already been registered')
    ) {
      return NextResponse.json({ error: 'Ya existe una cuenta con ese DNI.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  await notificarAdmin(
    gimnasioId,
    '🏋️ Nuevo alumno registrado',
    `${nombre_completo.trim()} se registró en la app.`
  )

  return NextResponse.json({ success: true })
}
