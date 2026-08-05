'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cancelarClase } from '../actions'

export default function CancelarClaseBtn({ claseId }: { claseId: string }) {
  const [confirmando, setConfirmando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleCancelar() {
    setError(null)
    startTransition(async () => {
      const result = await cancelarClase(claseId)
      if ('error' in result) {
        setError(result.error)
        setConfirmando(false)
      } else {
        router.refresh()
        setConfirmando(false)
      }
    })
  }

  if (!confirmando) {
    return (
      <button
        onClick={() => setConfirmando(true)}
        className="w-full py-3 rounded-xl border border-red-200 text-red-500 text-sm font-heading font-bold hover:bg-red-50 transition-colors"
      >
        Cancelar clase
      </button>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-body text-navy/70 text-center">
        ¿Confirmar cancelación? Los alumnos serán notificados.
      </p>
      {error && <p className="text-sm font-body text-red-500 text-center">{error}</p>}
      <div className="flex gap-3">
        <button
          onClick={() => setConfirmando(false)}
          disabled={isPending}
          className="flex-1 py-3 rounded-xl border border-navy/20 text-navy text-sm font-heading font-bold hover:bg-navy/5 transition-colors disabled:opacity-50"
        >
          No, volver
        </button>
        <button
          onClick={handleCancelar}
          disabled={isPending}
          className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-heading font-bold transition-all active:scale-95 disabled:opacity-50"
        >
          {isPending ? 'Cancelando...' : 'Sí, cancelar'}
        </button>
      </div>
    </div>
  )
}
