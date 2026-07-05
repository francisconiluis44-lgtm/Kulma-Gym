'use client'
import { useEffect, useState } from 'react'

export default function NotificacionesBtn() {
  const [estado, setEstado] = useState<'idle' | 'activadas' | 'bloqueadas' | 'cargando'>('idle')

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    const perm = Notification.permission
    if (perm === 'granted') setEstado('activadas')
    else if (perm === 'denied') setEstado('bloqueadas')
  }, [])

  async function activar() {
    setEstado('cargando')
    try {
      await new Promise<void>((resolve, reject) => {
        // @ts-expect-error global
        window.OneSignalDeferred = window.OneSignalDeferred || []
        // @ts-expect-error global
        window.OneSignalDeferred.push(async (OneSignal: { Notifications: { requestPermission: () => Promise<void>; permission: boolean } }) => {
          try {
            await OneSignal.Notifications.requestPermission()
            resolve()
          } catch (e) {
            reject(e)
          }
        })
      })
    } catch {
      // fallback directo
      if ('Notification' in window) await Notification.requestPermission()
    }
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
        <p className="text-sm font-body text-red-600">Notificaciones bloqueadas. Habilitálas desde Configuración → Safari → Notificaciones.</p>
      </div>
    )
  }

  return (
    <button
      onClick={activar}
      disabled={estado === 'cargando'}
      className="w-full flex items-center gap-3 bg-white border border-gray-200 px-4 py-3 rounded-2xl shadow-sm hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-60"
    >
      <div className="w-10 h-10 bg-navy rounded-xl flex items-center justify-center shrink-0">
        <span className="text-xl">🔔</span>
      </div>
      <div className="text-left">
        <p className="text-sm font-semibold font-body text-navy">
          {estado === 'cargando' ? 'Activando...' : 'Activar notificaciones'}
        </p>
        <p className="text-xs font-body text-navy/50">Recibí avisos de tu membresía y del profe</p>
      </div>
      <span className="ml-auto text-navy/30 text-lg">›</span>
    </button>
  )
}
