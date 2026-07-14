import { createAdminClient } from '@/lib/supabase/admin'

const APP_ID = '36bc75de-bdc9-4929-bb15-6f53adb227d4'
const API_URL = 'https://onesignal.com/api/v1/notifications'

interface PushPayload {
  titulo: string
  mensaje: string
  alumnoId: string
}

export async function notificarAlumnos(gimnasioId: string, titulo: string, mensaje: string) {
  const supabase = createAdminClient()
  const { data: alumnos } = await supabase
    .from('alumnos')
    .select('id')
    .eq('gimnasio_id', gimnasioId)

  if (!alumnos || alumnos.length === 0) return

  await Promise.all(
    alumnos.map(a => enviarPush({ titulo, mensaje, alumnoId: a.id }))
  )
}

export async function notificarAdmin(gimnasioId: string, titulo: string, mensaje: string) {
  const supabase = createAdminClient()
  const { data: admins } = await supabase
    .from('gym_admins')
    .select('user_id')
    .eq('gimnasio_id', gimnasioId)

  if (!admins || admins.length === 0) return

  await Promise.all(
    admins.map(a => enviarPush({ titulo, mensaje, alumnoId: a.user_id }))
  )
}

export async function enviarPush({ titulo, mensaje, alumnoId }: PushPayload) {
  const apiKey = process.env.ONESIGNAL_REST_API_KEY
  if (!apiKey) {
    console.error('[OneSignal] Falta ONESIGNAL_REST_API_KEY')
    return
  }

  const body: Record<string, unknown> = {
    app_id: APP_ID,
    headings: { en: titulo },
    contents: { en: mensaje },
    include_aliases: { external_id: [alumnoId] },
    target_channel: 'push',
  }

  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${apiKey}`,
      },
      body: JSON.stringify(body),
    })
  } catch (e) {
    console.error('[OneSignal] error fetch:', e)
  }
}
