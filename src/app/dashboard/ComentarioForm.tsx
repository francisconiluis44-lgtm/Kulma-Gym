'use client'

import { useActionState, useRef, useEffect } from 'react'
import { enviarComentario } from './actions'

export default function ComentarioForm({ comunicadoId }: { comunicadoId: string }) {
  const bound = enviarComentario.bind(null, comunicadoId)
  const [state, formAction, pending] = useActionState(bound, { error: null, ok: false })
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.ok) formRef.current?.reset()
  }, [state.ok])

  return (
    <form ref={formRef} action={formAction} className="flex gap-2 mt-3">
      <input
        name="cuerpo"
        type="text"
        placeholder="Añadí un comentario..."
        required
        className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange text-navy font-body placeholder:text-gray-300 transition-colors"
      />
      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 text-sm bg-orange text-white font-semibold rounded-lg hover:bg-orange/90 disabled:opacity-60 font-body transition-colors"
      >
        {pending ? '...' : 'Enviar'}
      </button>
      {state.error && (
        <p className="text-red-500 text-xs font-body mt-1">{state.error}</p>
      )}
    </form>
  )
}
