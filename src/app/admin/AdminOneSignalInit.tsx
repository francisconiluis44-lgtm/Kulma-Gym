'use client'
import { useEffect } from 'react'

export default function AdminOneSignalInit({ userId }: { userId: string }) {
  useEffect(() => {
    async function register() {
      for (let i = 0; i < 60; i++) {
        // @ts-expect-error global
        const os = window.OneSignal
        if (os && typeof os.login === 'function') {
          try { await os.Notifications.requestPermission() } catch { /* silencioso */ }
          try { await os.login(userId) } catch { /* silencioso */ }
          return
        }
        await new Promise(r => setTimeout(r, 500))
      }
    }
    register()
  }, [userId])

  return null
}
