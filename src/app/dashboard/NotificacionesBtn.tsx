'use client'
import { useEffect, useState } from 'react'

type OS = {
  Notifications: { requestPermission: () => Promise<void> }
  login: (externalId: string) => Promise<void>
}

function getOS(): OS | null {
  // @ts-expect-error global
  return typeof window !== 'undefined' ? (window.OneSignal ?? null) : null
}

export default function NotificacionesBtn({ userId }: { userId: string }) {
  const [estado, setEstado] = useState<'idle' | 'activadas' | 'bloqueadas'>('idle')

  useEffect(() => {
    if (!('Notification' in window)) return
    if (Notification.permission === 'granted') {
      setEstado('activadas')
      suscribirOneSignal()
    } else if (Notification.permission === 'denied') {
      setEstado('bloqueadas')
    }
  }, [])

  async function suscribirOneSignal() {
    let os = getOS()
    for (let i = 0; i < 10 && !os; i++) {
      await new Promise((r) => setTimeout(r, 500))
      os = getOS()
    }
    if (!os) return
    try {
      await os.Notifications.requestPermission()
      // Vincular suscripción con el ID del alumno en Supabase
      await os.login(userId)
    } catch {
      // silencioso
    }
  }

  async function activar() {
    const perm = await Notification.requestPermission()
    if (perm !== 'granted') {
      setEstado('bloqueadas')
      return
    }
    setEstado('activadas')
    await suscribirOneSignal()
  }

  if (estado === 'activadas') {
    return (
      <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-3 rounded-2xl">
        <span className="text-green-600 text-lg">🔔</span>
        <p className="text-sm font-body text-green-700 font-semibold">Notificaciones activadas</p>
      </div>
    )
  }

  if (estado === 'bloqueadas') {
    return (
      <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-4 py-3 rounded-2xl">
        <span className="text-lg">🔕</span>
        <p className="text-sm font-body text-red-600">Notificaciones bloqueadas. Habilitálas desde Configuración → Kulma Gym → Notificaciones.</p>
      </div>
    )
  }

  return (
    <button
      onClick={activar}
      className="w-full flex items-center gap-3 bg-white border border-gray-200 px-4 py-3 rounded-2xl shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
    >
      <div className="w-10 h-10 bg-navy rounded-xl flex items-center justify-center shrink-0">
        <span className="text-xl">🔔</span>
      </div>
      <div className="text-left">
        <p className="text-sm font-semibold font-body text-navy">Activar notificaciones</p>
        <p className="text-xs font-body text-navy/50">Recibí avisos de tu membresía y del profe</p>
      </div>
      <span className="ml-auto text-navy/30 text-lg">›</span>
    </button>
  )
}
