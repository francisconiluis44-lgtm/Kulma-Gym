'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import InstallPwa from '@/app/InstallPwa'

type Props = {
  gymNombre: string
  logoUrl: string | null
  emailDomain: string
}

const inputCn =
  'w-full px-4 py-3 rounded-xl border border-navy/12 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange/60 text-navy font-body placeholder:text-navy/25 bg-white transition-all'

export default function LoginForm({ gymNombre, logoUrl, emailDomain }: Props) {
  const [dni, setDni] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: `${dni.trim()}@${emailDomain}`,
      password,
    })

    if (error) {
      setError('DNI o contraseña incorrectos.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div
      className="min-h-[100dvh] flex items-center justify-center px-4 py-10"
      style={{
        background: `radial-gradient(ellipse 90% 45% at 50% 0%, color-mix(in srgb, var(--color-orange) 12%, var(--color-cream)), var(--color-cream))`,
      }}
    >
      <div className="w-full max-w-sm">
        {/* ── Logo / nombre ── */}
        <div
          className="text-center mb-8 animate-fade-in"
          style={{ animationDelay: '0ms' }}
        >
          {logoUrl ? (
            <div className="inline-flex items-center justify-center mb-3">
              <img
                src={logoUrl}
                alt={gymNombre}
                className="h-20 w-20 object-contain rounded-2xl"
                style={{ boxShadow: '0 0 0 4px color-mix(in srgb, var(--color-orange) 18%, transparent), 0 8px 24px rgba(0,0,0,0.10)' }}
              />
            </div>
          ) : (
            <h1
              className="text-3xl font-heading font-black tracking-tight bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(160deg, var(--color-navy) 40%, var(--color-orange) 100%)' }}
            >
              {gymNombre}
            </h1>
          )}
          {logoUrl && (
            <p className="text-base font-heading font-bold text-navy/80">{gymNombre}</p>
          )}
        </div>

        {/* ── Card ── */}
        <div
          className="bg-white rounded-2xl px-8 py-8 animate-fade-in"
          style={{
            animationDelay: '80ms',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.08)',
            borderTop: '3px solid var(--color-orange)',
          }}
        >
          <h2 className="text-lg font-heading font-semibold text-navy mb-6">
            Iniciá sesión
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="animate-fade-in" style={{ animationDelay: '140ms' }}>
              <label className="block text-[11px] font-semibold text-navy/45 mb-2 font-body tracking-widest uppercase">
                DNI
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                placeholder="12345678"
                required
                autoComplete="username"
                className={inputCn}
              />
            </div>

            <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
              <label className="block text-[11px] font-semibold text-navy/45 mb-2 font-body tracking-widest uppercase">
                Contraseña
              </label>
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
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-navy/30 hover:text-navy/60 transition-colors p-1"
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
              <p className="mt-2 text-[11px] text-navy/35 font-body leading-relaxed">
                ¿Olvidaste tu contraseña? Hablá con tu profe o pasate por el gimnasio.
              </p>
            </div>

            {error && (
              <p className="text-red-500 text-sm font-body bg-red-50 px-3 py-2.5 rounded-lg border border-red-100">
                {error}
              </p>
            )}

            <div className="animate-fade-in" style={{ animationDelay: '260ms' }}>
              <button
                type="submit"
                disabled={loading}
                className="btn-shine w-full py-3.5 mt-1 bg-orange text-white font-semibold rounded-xl hover:bg-orange/90 active:scale-[0.98] transition-all disabled:opacity-60 font-body"
                style={{ boxShadow: '0 0 24px color-mix(in srgb, var(--color-orange) 28%, transparent)' }}
              >
                {loading ? 'Ingresando...' : 'Ingresar'}
              </button>
            </div>
          </form>
        </div>

        {/* ── Acciones secundarias ── */}
        <div
          className="mt-5 animate-fade-in"
          style={{ animationDelay: '320ms' }}
        >
          <InstallPwa gymNombre={gymNombre} />
        </div>

        <div
          className="mt-4 text-center space-y-2.5 animate-fade-in"
          style={{ animationDelay: '360ms' }}
        >
          <p className="text-sm text-navy/55 font-body">
            ¿No tenés cuenta?{' '}
            <Link href="/registro" className="text-orange font-semibold hover:underline">
              Registrate
            </Link>
          </p>
          <Link
            href="/admin/login"
            className="block text-xs text-navy/30 hover:text-navy/50 transition-colors font-body"
          >
            Soy administrador →
          </Link>
        </div>
      </div>
    </div>
  )
}
