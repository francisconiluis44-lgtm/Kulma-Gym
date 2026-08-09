'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const inputCn =
  'w-full px-4 py-3 rounded-xl bg-white/[0.07] border border-white/15 focus:outline-none focus:ring-2 focus:ring-orange/50 focus:border-orange/50 text-white font-body placeholder:text-white/25 transition-all'

export default function LoginForm({ gymNombre, code }: { gymNombre: string; code?: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [forgotMode, setForgotMode] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetStatus, setResetStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [resetError, setResetError] = useState('')

  const router = useRouter()

  useEffect(() => {
    if (code) {
      const supabase = createClient()
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (!error) router.replace('/admin')
      })
      return
    }
    const hash = window.location.hash
    if (!hash) return
    const params = new URLSearchParams(hash.slice(1))
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    if (accessToken && refreshToken) {
      const supabase = createClient()
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(() => router.replace('/admin'))
    }
  }, [code, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) {
      setError('Email o contraseña incorrectos.')
      setLoading(false)
      return
    }
    router.push('/admin')
    router.refresh()
  }

  function openForgot() {
    setResetEmail(email.trim())
    setResetStatus('idle')
    setResetError('')
    setForgotMode(true)
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (!resetEmail.trim()) return
    setResetStatus('loading')
    const supabase = createClient()
    const redirectTo = window.location.origin + '/auth/reset-password'
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), { redirectTo })
    if (error) {
      setResetError(
        error.message && error.message !== '{}' ? error.message : 'Error al enviar el email. Verificá que el email sea correcto.',
      )
      setResetStatus('error')
    } else {
      setResetStatus('sent')
    }
  }

  return (
    <div className="min-h-[100dvh] bg-navy flex flex-col md:grid md:grid-cols-2">
      {/* ── Brand panel ── */}
      <div className="relative flex flex-col justify-end md:justify-center px-10 pt-14 pb-10 md:py-0 overflow-hidden min-h-[220px] md:min-h-0">
        {/* Concentric rings radiating from bottom-left — evoca platos de pesas */}
        <svg
          className="absolute inset-0 w-full h-full"
          aria-hidden="true"
          preserveAspectRatio="xMidYMid slice"
        >
          {[160, 280, 400, 540, 700].map((r, i) => (
            <circle
              key={r}
              cx="0"
              cy="100%"
              r={r}
              fill="none"
              stroke="white"
              strokeWidth="0.75"
              opacity={0.07 - i * 0.01}
            />
          ))}
        </svg>

        {/* Focused orange glow behind the name */}
        <div className="absolute left-0 bottom-0 w-[340px] h-[340px] rounded-full bg-orange/20 blur-[100px] pointer-events-none" />
        {/* Tighter, brighter spot */}
        <div className="absolute left-6 bottom-8 w-[160px] h-[160px] rounded-full bg-orange/30 blur-[60px] pointer-events-none" />

        {/* Vertical accent stripe */}
        <div className="absolute left-0 top-[15%] bottom-[15%] w-[3px] rounded-r-full bg-gradient-to-b from-transparent via-orange to-transparent" />

        <div className="relative z-10 pl-2">
          <p className="text-orange text-[10px] font-semibold tracking-[0.22em] uppercase mb-4 font-body">
            Panel de administración
          </p>
          {/* Gradient text: white at top → orange at bottom */}
          <h1
            className="text-5xl lg:text-6xl font-heading font-black leading-[0.88] tracking-tight bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(175deg, #ffffff 30%, var(--color-orange) 100%)' }}
          >
            {gymNombre.toUpperCase()}
          </h1>
          <p className="mt-5 text-white/35 font-body text-sm leading-relaxed max-w-[260px]">
            Gestioná alumnos, cobros y clases desde un solo lugar.
          </p>
        </div>
      </div>

      {/* ── Form panel ── */}
      <div className="flex flex-col justify-center px-8 md:px-12 lg:px-16 py-12 border-t border-white/10 md:border-t-0 md:border-l md:border-white/10">
        {forgotMode ? (
          <ForgotPanel
            resetEmail={resetEmail}
            setResetEmail={setResetEmail}
            resetStatus={resetStatus}
            resetError={resetError}
            onSubmit={handleReset}
            onBack={() => setForgotMode(false)}
            inputCn={inputCn}
          />
        ) : (
          <div className="w-full max-w-sm mx-auto">
            <h2
              className="text-2xl font-heading font-bold text-white mb-1 animate-fade-in"
              style={{ animationDelay: '0ms' }}
            >
              Bienvenido
            </h2>
            <p
              className="text-white/40 font-body text-sm mb-8 animate-fade-in"
              style={{ animationDelay: '60ms' }}
            >
              Ingresá con tus credenciales de administrador.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="animate-fade-in" style={{ animationDelay: '120ms' }}>
                <label className="block text-[11px] font-semibold text-white/45 mb-2 font-body tracking-widest uppercase">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ejemplo.com"
                  required
                  autoComplete="email"
                  className={inputCn}
                />
              </div>

              <div className="animate-fade-in" style={{ animationDelay: '180ms' }}>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-semibold text-white/45 font-body tracking-widest uppercase">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={openForgot}
                    className="text-[11px] text-orange/60 hover:text-orange font-body transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className={inputCn + ' pr-12'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    tabIndex={-1}
                    aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors p-1"
                  >
                    {showPass ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-sm font-body bg-red-400/10 px-3 py-2.5 rounded-lg border border-red-400/20">
                  {error}
                </p>
              )}

              <div className="animate-fade-in" style={{ animationDelay: '240ms' }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-shine w-full py-3.5 mt-1 bg-orange text-white font-semibold rounded-xl hover:bg-orange/90 active:scale-[0.98] transition-all disabled:opacity-60 font-body"
                  style={{ boxShadow: '0 0 28px rgba(242, 100, 25, 0.30)' }}
                >
                  {loading ? 'Ingresando...' : 'Ingresar al panel'}
                </button>
              </div>
            </form>

            <div
              className="mt-8 flex flex-col items-center gap-2 animate-fade-in"
              style={{ animationDelay: '300ms' }}
            >
              <Link
                href="/admin/solicitar"
                className="text-xs text-orange/50 hover:text-orange/80 transition-colors font-body"
              >
                Solicitá acceso como administrador →
              </Link>
              <Link
                href="/login"
                className="text-xs text-white/20 hover:text-white/40 transition-colors font-body"
              >
                ← Login de alumnos
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ForgotPanel({
  resetEmail,
  setResetEmail,
  resetStatus,
  resetError,
  onSubmit,
  onBack,
  inputCn,
}: {
  resetEmail: string
  setResetEmail: (v: string) => void
  resetStatus: 'idle' | 'loading' | 'sent' | 'error'
  resetError: string
  onSubmit: (e: React.FormEvent) => void
  onBack: () => void
  inputCn: string
}) {
  return (
    <div className="w-full max-w-sm mx-auto">
      {resetStatus === 'sent' ? (
        <div className="text-center space-y-5">
          <div className="w-14 h-14 bg-green-500/15 border border-green-500/25 rounded-2xl flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-heading font-bold text-white">¡Revisá tu email!</h2>
          <p className="text-white/45 font-body text-sm leading-relaxed">
            Enviamos un link a{' '}
            <span className="text-white/70">{resetEmail}</span> para restablecer tu contraseña.
          </p>
          <button
            onClick={onBack}
            className="text-sm text-orange/70 hover:text-orange font-body transition-colors"
          >
            ← Volver al login
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 font-body transition-colors mb-8"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </button>

          <h2 className="text-2xl font-heading font-bold text-white mb-1">Recuperar contraseña</h2>
          <p className="text-white/40 font-body text-sm mb-8">
            Ingresá tu email y te mandamos un link para elegir una nueva.
          </p>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] font-semibold text-white/45 mb-2 font-body tracking-widest uppercase">
                Email
              </label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="admin@ejemplo.com"
                required
                autoFocus
                className={inputCn}
              />
            </div>
            {resetStatus === 'error' && (
              <p className="text-red-400 text-sm font-body bg-red-400/10 px-3 py-2.5 rounded-lg border border-red-400/20">
                {resetError}
              </p>
            )}
            <button
              type="submit"
              disabled={resetStatus === 'loading'}
              className="btn-shine w-full py-3.5 bg-orange text-white font-semibold rounded-xl hover:bg-orange/90 active:scale-[0.98] transition-all disabled:opacity-60 font-body"
              style={{ boxShadow: '0 0 28px rgba(242, 100, 25, 0.30)' }}
            >
              {resetStatus === 'loading' ? 'Enviando...' : 'Enviar link'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}
