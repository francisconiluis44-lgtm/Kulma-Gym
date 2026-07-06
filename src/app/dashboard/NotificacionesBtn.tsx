'use client'
import { useEffect, useState } from 'react'

type LogEntry = { ts: string; msg: string; ok: boolean }

function ts() {
  return new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function NotificacionesBtn({ userId }: { userId: string }) {
  const [estado, setEstado] = useState<'idle' | 'activadas' | 'bloqueadas'>('idle')
  const [logs, setLogs] = useState<LogEntry[]>([])

  function log(msg: string, ok = true) {
    setLogs((prev) => [...prev, { ts: ts(), msg, ok }])
  }

  useEffect(() => {
    log(`Notification API: ${'Notification' in window ? 'disponible' : 'NO disponible'}`, 'Notification' in window)
    if (!('Notification' in window)) return

    log(`Permiso actual: ${Notification.permission}`, Notification.permission === 'granted')

    // Service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        if (regs.length === 0) {
          log('SW: ninguno registrado', false)
        } else {
          regs.forEach((r) => {
            const url = r.active?.scriptURL ?? r.installing?.scriptURL ?? r.waiting?.scriptURL ?? 'desconocido'
            log(`SW registrado: ${url.split('/').pop()}`, true)
          })
        }
      })
    } else {
      log('Service Worker: NO soportado', false)
    }

    if (Notification.permission === 'granted') {
      setEstado('activadas')
      suscribirOneSignal()
    } else if (Notification.permission === 'denied') {
      setEstado('bloqueadas')
    }
  }, [])

  async function suscribirOneSignal() {
    log('Buscando OneSignal SDK...')
    for (let i = 0; i < 60; i++) {
      // @ts-expect-error global
      const os = window.OneSignal
      if (os && typeof os.login === 'function') {
        log(`SDK encontrado (intento ${i + 1})`, true)

        try {
          await os.Notifications.requestPermission()
          log('requestPermission() OK', true)
        } catch (e) {
          log(`requestPermission() error: ${e}`, false)
        }

        try {
          await os.login(userId)
          log(`login(${userId.slice(0, 8)}…) OK`, true)
        } catch (e) {
          log(`login() error: ${e}`, false)
        }

        // Intentar leer el Subscription ID
        try {
          // @ts-expect-error global
          const subId = window.OneSignal?.User?.PushSubscription?.id
          if (subId) {
            log(`Subscription ID: ${subId}`, true)
          } else {
            log('Subscription ID: no disponible aún', false)
          }
        } catch { /* silencioso */ }

        return
      }
      if (i === 0) log('SDK no listo, esperando...')
      await new Promise((r) => setTimeout(r, 500))
    }
    log('SDK no encontrado después de 30s', false)
  }

  async function activar() {
    log('Usuario tocó Activar')
    const perm = await Notification.requestPermission()
    log(`Permiso del navegador: ${perm}`, perm === 'granted')
    if (perm !== 'granted') {
      setEstado('bloqueadas')
      return
    }
    setEstado('activadas')
    await suscribirOneSignal()
  }

  const debugPanel = logs.length > 0 && (
    <div className="mt-2 bg-gray-900 text-white rounded-xl px-3 py-2 text-xs font-mono space-y-0.5">
      <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Debug OneSignal</p>
      {logs.map((l, i) => (
        <p key={i} className={l.ok ? 'text-green-400' : 'text-red-400'}>
          <span className="text-gray-500">{l.ts}</span> {l.msg}
        </p>
      ))}
    </div>
  )

  if (estado === 'activadas') {
    return (
      <div>
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-3 rounded-2xl">
          <span className="text-green-600 text-lg">🔔</span>
          <p className="text-sm font-body text-green-700 font-semibold">Notificaciones activadas</p>
        </div>
        {debugPanel}
      </div>
    )
  }

  if (estado === 'bloqueadas') {
    return (
      <div>
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-4 py-3 rounded-2xl">
          <span className="text-lg">🔕</span>
          <p className="text-sm font-body text-red-600">Notificaciones bloqueadas. Habilitálas desde Configuración → Kulma Gym → Notificaciones.</p>
        </div>
        {debugPanel}
      </div>
    )
  }

  return (
    <div>
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
      {debugPanel}
    </div>
  )
}
