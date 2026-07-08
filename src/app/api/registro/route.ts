import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { studentEmailDomain } from '@/lib/gym-context'
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

  // Resolve gym ID for the alumno record
  const { data: gym } = await adminSupabase
    .from('gimnasios')
    .select('id')
    .eq('slug', slug)
    .single()
  const gimnasioId = gym?.id ?? '00000000-0000-0000-0000-000000000001'

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

  return NextResponse.json({ success: true })
}
