import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enviarPush } from '@/lib/onesignal'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const hoy = new Date(new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }) + 'T00:00:00')
  const en3dias = new Date(hoy)
  en3dias.setDate(en3dias.getDate() + 3)
  const fecha = en3dias.toISOString().slice(0, 10)

  const adminSupabase = createAdminClient()
  const { data: alumnos } = await adminSupabase
    .from('alumnos')
    .select('id')
    .eq('fecha_vencimiento', fecha)

  if (!alumnos || alumnos.length === 0) {
    return NextResponse.json({ enviados: 0 })
  }

  await Promise.all(
    alumnos.map((a) =>
      enviarPush({
        titulo: '⏳ Tu membresía vence pronto',
        mensaje: 'Tu membresía vence en 3 días. Renovála para seguir entrenando.',
        alumnoId: a.id,
      })
    )
  )

  return NextResponse.json({ enviados: alumnos.length })
}
