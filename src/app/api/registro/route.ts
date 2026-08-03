import { createAdminClient } from '@/lib/supabase/admin'
import { getGymContext, studentEmailDomain } from '@/lib/gym-context'
import { notificarAdmin } from '@/lib/onesignal'
import { getAlumnosLimit } from '@/lib/plan-features'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { nombre_completo, dni, whatsapp, email, fecha_nacimiento, password } =
    await request.json()

  if (!nombre_completo || !dni || !whatsapp || !password) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres.' }, { status: 400 })
  }

  const gym = await getGymContext()
  const emailDomain = studentEmailDomain(gym.slug)

  const adminSupabase = createAdminClient()
  const gimnasioId = gym.id

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
