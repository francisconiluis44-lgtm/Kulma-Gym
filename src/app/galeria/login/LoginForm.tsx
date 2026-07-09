'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const inputCn =
  'w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-orange/60 focus:border-orange/60 text-white font-body placeholder:text-white/30 transition-colors'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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

    router.push('/galeria')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-xs font-body font-semibold tracking-widest text-orange uppercase mb-1">
            Galería de
          </p>
          <h1 className="text-4xl font-heading font-extrabold text-white leading-tight">
            CONTENIDO
          </h1>
          <span className="inline-block mt-3 px-3 py-1 bg-orange/20 text-orange text-xs font-semibold rounded-full font-body tracking-wide">
            FOTOS Y VIDEOS
          </span>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl px-8 py-8">
          <h2 className="text-lg font-heading font-semibold text-white mb-6">Acceso</h2>

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
              <label className="block text-sm font-medium text-white/70 mb-1.5 font-body">Contraseña</label>
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
      </div>
    </div>
  )
}
