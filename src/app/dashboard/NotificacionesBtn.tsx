'use client'
import { useEffect, useState } from 'react'

export default function NotificacionesBtn() {
  const [estado, setEstado] = useState<'idle' | 'activadas' | 'bloqueadas'>('idle')

  useEffect(() => {
    if (!('Notification' in window)) return

    // Si ya tiene permiso, intentar registrar con OneSignal automáticamente
    if (Notification.permission === 'granted') {
      registrarEnOneSignal()
      setEstado('activadas')
    } else if (Notification.permission === 'denied') {
      setEstado('bloqueadas')
    }
  }, [])

  function registrarEnOneSignal() {
    // @ts-expect-error global
    window.OneSignalDeferred = window.OneSignalDeferred || []
    // @ts-expect-error global
    window.OneSignalDeferred.push(async (OneSignal: { Notifications: { requestPermission: () => Promise<void>; permissionNative: string; optIn: () => Promise<void> } }) => {
      try {
        if (OneSignal.Notifications.permissionNative === 'granted') {
          await OneSignal.Notifications.optIn()
        } else {
          await OneSignal.Notifications.requestPermission()
        }
      } catch {
        // silencioso
      }
    })
  }

  async function activar() {
    // @ts-expect-error global
    window.OneSignalDeferred = window.OneSignalDeferred || []
    await new Promise<void>((resolve) => {
      // @ts-expect-error global
      window.OneSignalDeferred.push(async (OneSignal: { Notifications: { requestPermission: () => Promise<void>; optIn: () => Promise<void> } }) => {
        try {
          await OneSignal.Notifications.requestPermission()
          await OneSignal.Notifications.optIn()
        } catch {
          // fallback
          await Notification.requestPermission()
        }
        resolve()
      })
    })

    const perm = 'Notification' in window ? Notification.permission : 'denied'
    setEstado(perm === 'granted' ? 'activadas' : 'bloqueadas')
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
