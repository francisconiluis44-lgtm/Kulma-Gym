import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL ?? 'luissitto98@gmail.com'
const WHATSAPP_NUMBER = '542477221589'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { nombre, nombre_gimnasio, email, whatsapp, plan_interes, mensaje } = body

  if (!nombre || !email || !whatsapp) {
    return NextResponse.json({ error: 'Faltan campos requeridos.' }, { status: 400 })
  }

  const adminSupabase = createAdminClient()
  const { error: dbError } = await adminSupabase.from('leads').insert({
    nombre,
    nombre_gimnasio,
    email,
    whatsapp,
    plan_interes,
    mensaje,
  })

  if (dbError) {
    return NextResponse.json({ error: 'Error al guardar. Intentá de nuevo.' }, { status: 500 })
  }

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'SimpleGym <noreply@simplegym.fit>',
      to: ADMIN_EMAIL,
      subject: `Nuevo lead SimpleGym: ${nombre_gimnasio || nombre}`,
      html: `
        <h2>Nuevo contacto desde SimpleGym</h2>
        <p><strong>Nombre:</strong> ${nombre}</p>
        <p><strong>Gimnasio:</strong> ${nombre_gimnasio ?? '-'}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>WhatsApp:</strong> ${whatsapp}</p>
        <p><strong>Plan de interés:</strong> ${plan_interes ?? '-'}</p>
        <p><strong>Mensaje:</strong> ${mensaje ?? '-'}</p>
        <hr/>
        <a href="https://wa.me/${WHATSAPP_NUMBER}?text=Hola%20${encodeURIComponent(nombre)}!">
          Responder por WhatsApp
        </a>
      `,
    })
  }

  return NextResponse.json({ ok: true })
}
