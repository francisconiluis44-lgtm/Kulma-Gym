'use client'
import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type Mode = 'android' | 'ios-safari' | 'ios-other' | null

function detectMode(): Mode {
  const ua = navigator.userAgent
  const isIOS = /iPhone|iPad|iPod/.test(ua)
  const isStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true
  if (isStandalone) return null
  if (isIOS) {
    if (/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)) return 'ios-other'
    return 'ios-safari'
  }
  return 'android'
}

function IosOtherBanner({ onDismiss }: { onDismiss: () => void }) {
  const [copied, setCopied] = useState(false)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // fallback: select the text
    }
  }

  return (
    <div className="bg-navy text-white px-4 py-3 rounded-2xl shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="shrink-0 w-8 h-8 bg-orange rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="12" x2="15" y2="15"/>
            </svg>
          </div>
          <p className="text-sm font-semibold font-body">Abrila en Safari para instalar</p>
        </div>
        <button onClick={onDismiss} className="text-white/50 hover:text-white transition-colors p-1 shrink-0" aria-label="Cerrar">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div className="flex items-center gap-2">
        <p className="text-xs text-white/70 font-body flex-1">
          1. Copiá el enlace &nbsp;2. Abrí <span className="font-bold text-white">Safari</span> &nbsp;3. Pegalo y listo
        </p>
        <button
          onClick={copiar}
          className="bg-orange text-white text-xs font-semibold font-body px-3 py-2 rounded-xl active:scale-95 transition-all whitespace-nowrap shrink-0"
        >
          {copied ? '¡Copiado! ✓' : 'Copiar enlace'}
        </button>
      </div>
    </div>
  )
}

export default function InstallPwa() {
  const [mode, setMode] = useState<Mode>(null)
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setMode(detectMode())
    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (dismissed) return null
  if (mode === 'android' && !prompt) return null
  if (!mode) return null

  async function handleInstall() {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted' || outcome === 'dismissed') {
      setDismissed(true)
      setPrompt(null)
    }
  }

  // iPhone en Chrome u otro navegador
  if (mode === 'ios-other') {
    return (
      <IosOtherBanner onDismiss={() => setDismissed(true)} />
    )
  }

  // iPhone en Safari
  if (mode === 'ios-safari') {
    return (
      <div className="bg-navy text-white px-4 py-3 rounded-2xl shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange rounded-lg flex items-center justify-center shrink-0">
              {/* Phone download icon */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12 16l-5-5h3V4h4v7h3l-5 5z"/><path d="M5 18v2h14v-2H5z"/>
              </svg>
            </div>
            <p className="text-sm font-semibold font-body">Instalá Kulma Gym</p>
          </div>
          <button onClick={() => setDismissed(true)} className="text-white/50 hover:text-white transition-colors p-1 shrink-0" aria-label="Cerrar">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="flex flex-col gap-1 text-sm font-body text-white/80">
          <div className="flex items-center gap-1.5">
            <span>1. Tocá</span>
            <span className="font-semibold text-white">···</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>2. Tocá</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-orange shrink-0">
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            <span className="font-semibold text-white">Compartir</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>3. Tocá</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4 shrink-0">
              <rect x="3" y="3" width="18" height="18" rx="3"/>
              <line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            <span className="font-semibold text-white">Agregar a Inicio</span>
          </div>
        </div>
      </div>
    )
  }

  // Android — botón de instalación nativa
  return (
    <div className="flex items-center gap-3 bg-navy text-white px-4 py-3 rounded-2xl shadow-lg">
      <div className="shrink-0 w-10 h-10 bg-orange rounded-xl flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M12 16l-5-5h3V4h4v7h3l-5 5z"/><path d="M5 18v2h14v-2H5z"/>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold font-body leading-tight">Instalá Kulma Gym</p>
        <p className="text-xs text-white/60 font-body">Activá las notificaciones primero, luego instalá</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={handleInstall} className="bg-orange text-white text-sm font-semibold font-body px-4 py-2 rounded-xl hover:bg-orange/90 active:scale-95 transition-all">
          Instalar
        </button>
        <button onClick={() => setDismissed(true)} className="text-white/50 hover:text-white transition-colors p-1" aria-label="Cerrar">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
