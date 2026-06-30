'use client'

import { useActionState, useRef, useEffect } from 'react'
import { enviarMensaje } from './actions'

export default function MensajeForm() {
  const [state, formAction, pending] = useActionState(enviarMensaje, {
    error: null,
    ok: false,
  })
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.ok) formRef.current?.reset()
  }, [state.ok])

  return (
    <div className="bg-white rounded-2xl shadow-sm px-5 py-5">
      <h3 className="font-heading font-semibold text-navy mb-3">
        Enviar mensaje al profe
      </h3>
      <form ref={formRef} action={formAction} className="space-y-3">
        <textarea
          name="cuerpo"
          required
          rows={3}
          placeholder="Pregunta, sugerencia o consulta..."
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange text-navy font-body placeholder:text-gray-300 transition-colors resize-none text-sm"
        />
        {state.error && (
          <p className="text-red-500 text-sm font-body bg-red-50 px-3 py-2 rounded-lg">
            {state.error}
          </p>
        )}
        {state.ok && (
          <p className="text-green-600 text-sm font-body bg-green-50 px-3 py-2 rounded-lg">
            Mensaje enviado. El profe lo va a leer pronto.
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full py-2.5 bg-navy text-white font-semibold rounded-xl hover:bg-navy/90 active:scale-[0.98] transition-all disabled:opacity-60 font-body text-sm"
        >
          {pending ? 'Enviando...' : 'Enviar mensaje'}
        </button>
      </form>
    </div>
  )
}
