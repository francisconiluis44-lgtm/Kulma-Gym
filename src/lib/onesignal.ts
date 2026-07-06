const APP_ID = '36bc75de-bdc9-4929-bb15-6f53adb227d4'
const API_URL = 'https://onesignal.com/api/v1/notifications'

interface PushPayload {
  titulo: string
  mensaje: string
  // Si se omite, se manda a todos los suscriptores
  alumnoId?: string
}

export async function enviarPush({ titulo, mensaje, alumnoId }: PushPayload) {
  const apiKey = process.env.ONESIGNAL_REST_API_KEY
  if (!apiKey) return

  const body: Record<string, unknown> = {
    app_id: APP_ID,
    headings: { en: titulo },
    contents: { en: mensaje },
  }

  if (alumnoId) {
    // Notificación a un alumno específico por su ID de Supabase
    body.include_aliases = { external_id: [alumnoId] }
    body.target_channel = 'push'
  } else {
    // Notificación a todos los suscriptores
    body.included_segments = ['Total Subscriptions']
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
  } catch {
    // No interrumpir el flujo principal si falla la notificación
  }
}
