'use client'
import { useEffect, useState } from 'react'

export default function NotificacionesBtn() {
  const [estado, setEstado] = useState<'idle' | 'activadas' | 'bloqueadas'>('idle')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const perm = Notification.permission
    if (perm === 'granted') setEstado('activadas')
    else if (perm === 'denied') setEstado('bloqueadas')
  }, [])

  async function activar() {
    const { default: OneSignal } = await import('react-onesignal')
    await OneSignal.Notifications.requestPermission()
    const perm = Notification.permission
    if (perm === 'granted') setEstado('activadas')
    else if (perm === 'denied') setEstado('bloqueadas')
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
        <p className="text-sm font-body text-red-600">Notificaciones bloqueadas. Habilitálas desde la configuración del navegador.</p>
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
