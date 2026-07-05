'use client'
import { useEffect } from 'react'

export default function OneSignalInit() {
  useEffect(() => {
    import('react-onesignal').then(({ default: OneSignal }) => {
      OneSignal.init({
        appId: '36bc75de-bdc9-4929-bb15-6f53adb227d4',
        allowLocalhostAsSecureOrigin: true,
      } as Parameters<typeof OneSignal.init>[0])
    })
  }, [])
  return null
}
