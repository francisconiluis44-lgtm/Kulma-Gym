'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { actualizarFechaVencimientoExterno } from './actions'

export default function EditarVencimientoForm({
  externoId,
  fechaVencimientoActual,
}: {
  externoId: string
  fechaVencimientoActual: string | null
}) {
  const [open, setOpen] = useState(false)
  const [fecha, setFecha] = useState(fechaVencimientoActual ?? '')
  const [msg, setMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    startTransition(async () => {
      const result = await actualizarFechaVencimientoExterno(externoId, fecha || null)
      if ('ok' in result) {
        setMsg({ type: 'ok', text: 'Fecha actualizada.' })
        setOpen(false)
        router.refresh()
      } else {
        setMsg({ type: 'error', text: result.error })
      }
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-orange hover:underline font-body"
      >
        Editar fecha
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-wrap mt-1">
      <input
        type="date"
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
        className="border border-gray-200 rounded-xl px-3 py-2 font-body text-sm text-navy focus:outline-none focus:ring-2 focus:ring-orange/40"
      />
      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 rounded-xl bg-orange text-white font-heading font-bold text-xs transition-all active:scale-95 disabled:opacity-50"
      >
        {isPending ? 'Guardando...' : 'Guardar'}
      </button>
      <button
        type="button"
        onClick={() => { setOpen(false); setMsg(null) }}
        className="text-xs text-navy/40 hover:text-navy font-body"
      >
        cancelar
      </button>
      {msg && (
        <p className={`text-xs font-body w-full ${msg.type === 'ok' ? 'text-green-600' : 'text-red-500'}`}>
          {msg.text}
        </p>
      )}
    </form>
  )
}
