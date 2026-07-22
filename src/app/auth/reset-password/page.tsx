'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function ResetForm() {
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    // Handle the token from the URL hash (Supabase puts it there)
    const hashParams = new URLSearchParams(window.location.hash.slice(1))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    if (accessToken && refreshToken) {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setStatus('loading')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setStatus('error')
    } else {
      setStatus('ok')
    }
  }

  if (status === 'ok') {
    return (
      <div className="text-center space-y-4">
        <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white font-heading">¡Contraseña actualizada!</h2>
        <p className="text-white/50 font-body text-sm">Ya podés ingresar al panel de tu gimnasio.</p>
        <a
          href="/admin/login"
          className="inline-block mt-2 bg-orange text-white font-semibold font-body text-sm px-6 py-3 rounded-xl hover:bg-orange/90 transition-all"
        >
          Ir al login →
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold font-body text-white/50 uppercase tracking-widest mb-1.5">
          Nueva contraseña
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Mínimo 6 caracteres"
          className="w-full bg-gray-800 border border-gray-700 text-white font-body text-sm rounded-xl px-4 py-3 placeholder-white/20 focus:outline-none focus:border-orange"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold font-body text-white/50 uppercase tracking-widest mb-1.5">
          Repetir contraseña
        </label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          placeholder="Repetí la contraseña"
          className="w-full bg-gray-800 border border-gray-700 text-white font-body text-sm rounded-xl px-4 py-3 placeholder-white/20 focus:outline-none focus:border-orange"
        />
      </div>
      {(error || status === 'error') && (
        <p className="text-red-400 font-body text-sm">{error}</p>
      )}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-orange text-white font-semibold font-body text-sm py-3 rounded-xl hover:bg-orange/90 transition-all disabled:opacity-50"
      >
        {status === 'loading' ? 'Guardando…' : 'Guardar contraseña'}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-2xl font-heading font-black text-white">
            Simple<span className="text-orange">Gym</span>
          </span>
          <p className="text-white/40 font-body text-sm mt-2">Elegí tu nueva contraseña</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl px-6 py-6">
          <Suspense>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
