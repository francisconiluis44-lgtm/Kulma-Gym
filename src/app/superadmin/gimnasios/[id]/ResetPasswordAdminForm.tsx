'use client'

import { useState, useTransition } from 'react'
import { resetearPasswordAdmin } from './actions'

export default function ResetPasswordAdminForm({ userId }: { userId: string }) {
  const [abierto, setAbierto] = useState(false)
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    startTransition(async () => {
      const result = await resetearPasswordAdmin(userId, password)
      if ('ok' in result) {
        setMsg({ type: 'ok', text: `Contraseña establecida: ${password}` })
        setPassword('')
      } else {
        setMsg({ type: 'error', text: result.error })
      }
    })
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="text-xs text-blue-400 hover:text-blue-300 font-body transition-colors"
      >
        Cambiar clave
      </button>
    )
  }

  return (
    <div className="w-full mt-2 space-y-2">
      {msg?.type === 'ok' ? (
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-xs font-body text-green-400 bg-green-900/30 px-3 py-1.5 rounded-lg flex-1">
            ✓ {msg.text}
          </p>
          <button
            onClick={() => navigator.clipboard.writeText(password || msg.text.split(': ')[1])}
            className="text-xs text-white/40 hover:text-white font-body transition-colors"
          >
            Copiar
          </button>
          <button onClick={() => { setAbierto(false); setMsg(null) }} className="text-xs text-white/30 font-body">
            Cerrar
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          <input
            type="text"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Nueva contraseña"
            minLength={6}
            required
            autoFocus
            className="flex-1 min-w-0 bg-gray-800 border border-gray-700 text-white font-body text-xs rounded-lg px-3 py-1.5 placeholder-white/20 focus:outline-none focus:border-orange"
          />
          <button
            type="submit"
            disabled={isPending || password.length < 6}
            className="bg-orange text-white text-xs font-semibold font-body px-3 py-1.5 rounded-lg hover:bg-orange/90 disabled:opacity-50 shrink-0"
          >
            {isPending ? '…' : 'Guardar'}
          </button>
          <button type="button" onClick={() => setAbierto(false)} className="text-xs text-white/30 font-body">
            ✕
          </button>
        </form>
      )}
      {msg?.type === 'error' && (
        <p className="text-xs text-red-400 font-body">{msg.text}</p>
      )}
    </div>
  )
}
