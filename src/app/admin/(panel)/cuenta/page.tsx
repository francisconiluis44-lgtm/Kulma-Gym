'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function CuentaPage() {
  const [current, setCurrent] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (newPass !== confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (newPass.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setStatus('loading')
    const supabase = createClient()
    // Re-authenticate with current password first
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      setError('No se pudo obtener el usuario')
      setStatus('error')
      return
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current,
    })
    if (signInError) {
      setError('Contraseña actual incorrecta')
      setStatus('error')
      return
    }
    const { error: updateError } = await supabase.auth.updateUser({ password: newPass })
    if (updateError) {
      setError(updateError.message)
      setStatus('error')
    } else {
      setStatus('ok')
      setCurrent('')
      setNewPass('')
      setConfirm('')
    }
  }

  const inputCn = 'w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange/40 text-navy font-body text-sm placeholder:text-navy/30'

  return (
    <div className="max-w-sm">
      <h2 className="text-2xl font-heading font-bold text-navy mb-6">Mi cuenta</h2>

      <div className="bg-white rounded-2xl shadow-sm px-6 py-6">
        <p className="text-xs font-semibold font-body text-orange uppercase tracking-widest mb-4">
          Cambiar contraseña
        </p>

        {status === 'ok' ? (
          <div className="text-center space-y-3 py-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold text-navy font-body">¡Contraseña actualizada!</p>
            <button
              onClick={() => setStatus('idle')}
              className="text-sm text-orange font-body hover:underline"
            >
              Cambiar de nuevo
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-navy/50 font-body mb-1.5">Contraseña actual</label>
              <input
                type="password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                required
                placeholder="••••••••"
                className={inputCn}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-navy/50 font-body mb-1.5">Nueva contraseña</label>
              <input
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                required
                placeholder="Mínimo 6 caracteres"
                className={inputCn}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-navy/50 font-body mb-1.5">Repetir nueva contraseña</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="Repetí la contraseña"
                className={inputCn}
              />
            </div>
            {error && (
              <p className="text-red-500 text-sm font-body bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-3 bg-orange text-white font-semibold font-body rounded-xl hover:bg-orange/90 transition-all disabled:opacity-60"
            >
              {status === 'loading' ? 'Guardando…' : 'Guardar contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
