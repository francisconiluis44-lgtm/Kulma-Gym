'use client'
import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPwa() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!prompt || dismissed) return null

  async function handleInstall() {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted' || outcome === 'dismissed') {
      setDismissed(true)
      setPrompt(null)
    }
  }

  return (
    <div className="flex items-center gap-3 bg-navy text-white px-4 py-3 rounded-2xl shadow-lg">
      {/* Phone + download icon */}
      <div className="shrink-0 w-10 h-10 bg-orange rounded-xl flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M12 16l-5-5h3V4h4v7h3l-5 5z"/>
          <path d="M5 18v2h14v-2H5z"/>
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold font-body leading-tight">Instalá Kulma Gym</p>
        <p className="text-xs text-white/60 font-body">Guardala en tu pantalla de inicio</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleInstall}
          className="bg-orange text-white text-sm font-semibold font-body px-4 py-2 rounded-xl hover:bg-orange/90 active:scale-95 transition-all"
        >
          Instalar
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-white/50 hover:text-white transition-colors p-1"
          aria-label="Cerrar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
