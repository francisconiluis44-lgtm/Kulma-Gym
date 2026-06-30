'use client'

import { useActionState, useRef, useEffect } from 'react'
import { responderMensaje } from './actions'

export default function ResponderForm({ mensajeId, respuestaActual }: { mensajeId: string; respuestaActual: string | null }) {
  const bound = responderMensaje.bind(null, mensajeId)
  const [state, formAction, pending] = useActionState(bound, { error: null, ok: false })
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.ok) formRef.current?.reset()
  }, [state.ok])

  if (respuestaActual) {
    return (
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-navy/40 font-body mb-1">Tu respuesta:</p>
        <p className="text-sm text-navy font-body">{respuestaActual}</p>
      </div>
    )
  }

  return (
    <form ref={formRef} action={formAction} className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
      <input
        name="respuesta"
        type="text"
        placeholder="Escribí tu respuesta..."
        required
        className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange text-navy font-body placeholder:text-gray-300 transition-colors"
      />
      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 text-sm bg-orange text-white font-semibold rounded-lg hover:bg-orange/90 disabled:opacity-60 font-body transition-colors shrink-0"
      >
        {pending ? '...' : 'Responder'}
      </button>
    </form>
  )
}
