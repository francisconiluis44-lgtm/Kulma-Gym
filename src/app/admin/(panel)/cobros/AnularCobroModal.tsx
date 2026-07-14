'use client'

import { useState, useTransition } from 'react'
import { anularCobro } from './actions'

interface Props {
  cobroId: string
  monto: number
  alumnoNombre: string
}

export default function AnularCobroModal({ cobroId, monto, alumnoNombre }: Props) {
  const [open, setOpen] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleOpen() {
    setOpen(true)
    setMotivo('')
    setError(null)
  }

  function handleClose() {
    if (isPending) return
    setOpen(false)
    setMotivo('')
    setError(null)
  }

  function handleAnular() {
    setError(null)
    startTransition(async () => {
      const result = await anularCobro(cobroId, motivo)
      if ('error' in result) {
        setError(result.error)
      } else {
        setOpen(false)
      }
    })
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="text-xs text-navy/40 hover:text-red-500 font-body transition-colors shrink-0"
        title="Anular cobro"
      >
        Anular
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div className="bg-white rounded-2xl shadow-xl px-6 py-7 w-full max-w-sm">
            <p className="text-2xl mb-3 text-center">🔄</p>
            <h3 className="text-lg font-heading font-bold text-navy text-center mb-1">
              Anular cobro
            </h3>
            <p className="text-sm text-navy/60 font-body text-center mb-5 leading-relaxed">
              ${monto.toLocaleString('es-AR')} · {alumnoNombre}
            </p>
            <p className="text-sm text-navy/60 font-body mb-4 leading-relaxed">
              El cobro quedará anulado con un registro de auditoría.{' '}
              <strong>No se puede deshacer.</strong>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-navy/80 mb-1.5 font-body">
                Motivo (opcional)
              </label>
              <input
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej: error de carga, devolución..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange text-navy font-body placeholder:text-gray-300 transition-colors"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleAnular() }}
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm font-body bg-red-50 px-3 py-2 rounded-lg mb-4">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-navy/70 font-body text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAnular}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold font-body text-sm transition-colors disabled:opacity-50"
              >
                {isPending ? 'Anulando...' : 'Anular cobro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
