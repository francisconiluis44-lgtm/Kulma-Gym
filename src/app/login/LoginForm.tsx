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

export default function LoginForm({ gymNombre, logoUrl, emailDomain }: Props) {
  const [dni, setDni] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
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
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={gymNombre}
              className="mx-auto h-32 w-32 object-contain mb-4 rounded-2xl shadow-sm"
            />
          ) : (
            <p className="text-2xl font-heading font-extrabold text-navy">{gymNombre}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg px-8 py-8">
          <h2 className="text-lg font-heading font-semibold text-navy mb-6">
            Iniciá sesión
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy/80 mb-1.5 font-body">
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

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-navy/80 font-body">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgot((v) => !v)}
                  className="text-xs text-navy/40 hover:text-navy/60 font-body transition-colors"
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
              {showForgot && (
                <p className="mt-2 text-sm font-body text-navy/60 bg-navy/5 rounded-lg px-3 py-2 leading-relaxed">
                  Hablá con tu profe o pasate por el gimnasio para restablecer tu contraseña.
                </p>
              )}
            </div>

            {error && (
              <p className="text-red-500 text-sm font-body bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
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

        <div className="mt-6">
          <InstallPwa gymNombre={gymNombre} />
        </div>

        <div className="mt-4 text-center space-y-3">
          <p className="text-sm text-navy/60 font-body">
            ¿No tenés cuenta?{' '}
            <Link href="/registro" className="text-orange font-semibold hover:underline">
              Registrate
            </Link>
          </p>
          <Link
            href="/admin/login"
            className="block text-xs text-navy/40 hover:text-navy/60 transition-colors font-body"
          >
            Soy administrador →
          </Link>
        </div>
      </div>
    </div>
  )
}

const inputCn =
  'w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange text-navy font-body placeholder:text-gray-300 transition-colors'
