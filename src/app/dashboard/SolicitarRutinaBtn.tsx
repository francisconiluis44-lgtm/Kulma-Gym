'use client'

import { useActionState, useState } from 'react'
import { solicitarRutina } from './actions'

export default function SolicitarRutinaBtn() {
  const [state, action, pending] = useActionState(solicitarRutina, { ok: false, error: null })
  const [confirmando, setConfirmando] = useState(false)

  if (state.ok) {
    return (
      <p className="text-sm text-green-600 font-body mt-2">
        Mensaje enviado al profe ✅
      </p>
    )
  }

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="inline-flex items-center gap-1.5 mt-2 text-sm font-semibold text-orange hover:text-orange/80 font-body transition-colors"
      >
        Solicitar nueva rutina →
      </button>
    )
  }

  return (
    <div className="mt-2 bg-orange/8 rounded-xl px-4 py-3">
      <p className="text-sm text-navy/80 font-body mb-3">
        ¿Querés solicitar una nueva rutina a tu profesor?
      </p>
      {state.error && (
        <p className="text-xs text-red-500 font-body mb-2">{state.error}</p>
      )}
      <form action={action} className="flex gap-2">
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          disabled={pending}
          className="flex-1 py-2 rounded-xl border border-gray-200 text-navy/60 font-body text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 py-2 rounded-xl bg-orange text-white font-semibold font-body text-sm hover:bg-orange/90 transition-colors disabled:opacity-50"
        >
          {pending ? 'Enviando...' : 'Solicitar'}
        </button>
      </form>
    </div>
  )
}
