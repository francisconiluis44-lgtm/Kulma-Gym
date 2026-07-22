'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const inputCn =
  'w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-orange/60 focus:border-orange/60 text-white font-body placeholder:text-white/30 transition-colors'

export default function LoginForm({ gymNombre }: { gymNombre: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [forgotMode, setForgotMode] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetStatus, setResetStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [resetError, setResetError] = useState('')

  const router = useRouter()

  // Handle invite / magic-link tokens that land on this page via hash
  useEffect(() => {
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
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

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
      setResetError(error.message)
      setResetStatus('error')
    } else {
      setResetStatus('sent')
    }
  }

  const header = (
    <div className="text-center mb-8">
      <p className="text-xs font-body font-semibold tracking-widest text-orange uppercase mb-1">
        Panel de
      </p>
      <h1 className="text-4xl font-heading font-extrabold text-white leading-tight">
        {gymNombre.toUpperCase()}
      </h1>
    </div>
  )

  if (forgotMode) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {header}
          <div className="bg-white/5 border border-white/10 rounded-2xl px-8 py-8">
            {resetStatus === 'sent' ? (
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-lg font-heading font-semibold text-white">¡Revisá tu email!</h2>
                <p className="text-white/50 font-body text-sm">
                  Te enviamos un link a{' '}
                  <span className="text-white/80">{resetEmail}</span> para restablecer tu contraseña.
                </p>
                <button
                  onClick={() => setForgotMode(false)}
                  className="text-sm text-orange/70 hover:text-orange font-body transition-colors"
                >
                  ← Volver al login
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-heading font-semibold text-white mb-2">Recuperar contraseña</h2>
                <p className="text-white/50 font-body text-sm mb-6">
                  Ingresá tu email y te mandamos un link para elegir una nueva contraseña.
                </p>
                <form onSubmit={handleReset} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5 font-body">Email</label>
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
                    <p className="text-red-400 text-sm font-body bg-red-400/10 px-3 py-2 rounded-lg">{resetError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={resetStatus === 'loading'}
                    className="w-full py-3 bg-orange text-white font-semibold rounded-xl hover:bg-orange/90 active:scale-[0.98] transition-all disabled:opacity-60 font-body"
                  >
                    {resetStatus === 'loading' ? 'Enviando...' : 'Enviar link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setForgotMode(false)}
                    className="w-full py-2 text-sm text-white/40 hover:text-white/60 font-body transition-colors"
                  >
                    Cancelar
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-xs font-body font-semibold tracking-widest text-orange uppercase mb-1">
            Panel de
          </p>
          <h1 className="text-4xl font-heading font-extrabold text-white leading-tight">
            {gymNombre.toUpperCase()}
          </h1>
          <span className="inline-block mt-3 px-3 py-1 bg-orange/20 text-orange text-xs font-semibold rounded-full font-body tracking-wide">
            ADMINISTRADOR
          </span>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl px-8 py-8">
          <h2 className="text-lg font-heading font-semibold text-white mb-6">Acceso admin</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5 font-body">Email</label>
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
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-white/70 font-body">Contraseña</label>
                <button
                  type="button"
                  onClick={openForgot}
                  className="text-xs text-orange/60 hover:text-orange font-body transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className={inputCn}
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm font-body bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 bg-orange text-white font-semibold rounded-xl hover:bg-orange/90 active:scale-[0.98] transition-all disabled:opacity-60 font-body"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center flex flex-col gap-2">
          <Link href="/login" className="text-xs text-white/30 hover:text-white/50 transition-colors font-body">
            ← Volver al login de alumnos
          </Link>
          <Link href="/admin/solicitar" className="text-xs text-orange/60 hover:text-orange transition-colors font-body">
            Solicitá acceso como admin →
          </Link>
        </p>
      </div>
    </div>
  )
}
