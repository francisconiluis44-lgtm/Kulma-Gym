'use client'
import { useEffect, useState } from 'react'

export default function NotificacionesBtn() {
  const [estado, setEstado] = useState<'idle' | 'activadas' | 'bloqueadas'>('idle')
  const [debugMsg, setDebugMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!('Notification' in window)) return

    if (Notification.permission === 'granted') {
      optInOneSignal().then(() => setEstado('activadas'))
    } else if (Notification.permission === 'denied') {
      setEstado('bloqueadas')
    }
  }, [])

  async function optInOneSignal() {
    // Espera hasta 5s a que OneSignal esté listo
    // @ts-expect-error global
    let OS = window.OneSignal
    for (let i = 0; i < 10 && !OS; i++) {
      await new Promise((r) => setTimeout(r, 500))
      // @ts-expect-error global
      OS = window.OneSignal
    }

    if (!OS) {
      setDebugMsg('OneSignal no cargó')
      return
    }

    try {
      await OS.Notifications.optIn()
      setDebugMsg(null)
    } catch (e) {
      setDebugMsg('optIn error: ' + String(e))
    }
  }

  async function activar() {
    const perm = await Notification.requestPermission()
    if (perm === 'granted') {
      await optInOneSignal()
      setEstado('activadas')
    } else {
      setEstado('bloqueadas')
    }
  }

  if (estado === 'activadas') {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-3 rounded-2xl">
          <span className="text-green-600 text-lg">🔔</span>
          <p className="text-sm font-body text-green-700 font-semibold">Notificaciones activadas</p>
        </div>
        {debugMsg && (
          <p className="text-xs text-red-500 font-body px-1">{debugMsg}</p>
        )}
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
    <div className="space-y-1">
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
      {debugMsg && (
        <p className="text-xs text-red-500 font-body px-1">{debugMsg}</p>
      )}
    </div>
  )
}
