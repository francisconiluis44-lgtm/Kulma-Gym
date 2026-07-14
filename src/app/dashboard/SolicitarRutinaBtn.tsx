'use client'

import { useActionState } from 'react'
import { solicitarRutina } from './actions'

export default function SolicitarRutinaBtn() {
  const [state, action, pending] = useActionState(solicitarRutina, { ok: false, error: null })

  if (state.ok) {
    return (
      <p className="text-sm text-green-600 font-body mt-2">
        Mensaje enviado al profe ✅
      </p>
    )
  }

  return (
    <form action={action} className="mt-2">
      {state.error && (
        <p className="text-xs text-red-500 font-body mb-1">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange hover:text-orange/80 font-body transition-colors disabled:opacity-50"
      >
        {pending ? 'Enviando...' : 'Solicitar nueva rutina →'}
      </button>
    </form>
  )
}
