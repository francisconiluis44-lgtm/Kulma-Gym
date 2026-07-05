'use client'
import Script from 'next/script'

export default function OneSignalInit() {
  return (
    <Script
      src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
      strategy="afterInteractive"
      onLoad={() => {
        // @ts-expect-error global OneSignal
        window.OneSignalDeferred = window.OneSignalDeferred || []
        // @ts-expect-error global OneSignal
        window.OneSignalDeferred.push(async (OneSignal: { init: (opts: object) => Promise<void> }) => {
          await OneSignal.init({
            appId: '36bc75de-bdc9-4929-bb15-6f53adb227d4',
            serviceWorkerPath: '/sw.js',
          })
        })
      }}
    />
  )
}
