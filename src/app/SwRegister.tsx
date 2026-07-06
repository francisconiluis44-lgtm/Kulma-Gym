'use client'
import { useEffect } from 'react'

export default function SwRegister() {
  useEffect(() => {
    // OneSignal registra su propio service worker durante init().
    // Registrarlo manualmente acá causa conflictos en PWA standalone en Android.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          if (
            reg.active?.scriptURL.includes('sw.js') &&
            !reg.active.scriptURL.includes('OneSignal')
          ) {
            reg.unregister()
          }
        }
      })
    }
  }, [])
  return null
}
