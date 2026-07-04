import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { nombre_completo, dni, whatsapp, email, fecha_nacimiento, password } =
    await request.json()

  if (!nombre_completo || !dni || !whatsapp || !password) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  const adminSupabase = createAdminClient()

  const { error } = await adminSupabase.auth.admin.createUser({
    email: `${dni.trim()}@kulmagym.app`,
    password,
    email_confirm: true,
    user_metadata: {
      nombre_completo: nombre_completo.trim(),
      dni: dni.trim(),
      whatsapp: whatsapp.trim(),
      email: email?.trim() ?? '',
      fecha_nacimiento: fecha_nacimiento ?? '',
    },
  })

  if (error) {
    if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already been registered')) {
      return NextResponse.json({ error: 'Ya existe una cuenta con ese DNI.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
