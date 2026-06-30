'use client'

import { useActionState, useRef, useEffect } from 'react'
import { enviarMensajeAAlumno } from './actions'

type Alumno = { id: string; nombre_completo: string }

export default function NuevoMensajeForm({ alumnos }: { alumnos: Alumno[] }) {
  const [state, formAction, pending] = useActionState(enviarMensajeAAlumno, {
    error: null,
    ok: false,
  })
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.ok) formRef.current?.reset()
  }, [state.ok])

  return (
    <div className="bg-white rounded-2xl shadow-sm px-6 py-6 mb-8">
      <h3 className="text-lg font-heading font-semibold text-navy mb-4">
        Nuevo mensaje a alumno
      </h3>
      <form ref={formRef} action={formAction} className="space-y-3">
        <select
          name="alumno_id"
          required
          defaultValue=""
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange text-navy font-body transition-colors bg-white"
        >
          <option value="" disabled>Seleccioná un alumno...</option>
          {alumnos.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre_completo}
            </option>
          ))}
        </select>

        <textarea
          name="cuerpo"
          required
          rows={3}
          placeholder="Escribí tu mensaje..."
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange text-navy font-body placeholder:text-gray-300 transition-colors resize-none text-sm"
        />

        {state.error && (
          <p className="text-red-500 text-sm font-body bg-red-50 px-3 py-2 rounded-lg">
            {state.error}
          </p>
        )}
        {state.ok && (
          <p className="text-green-600 text-sm font-body bg-green-50 px-3 py-2 rounded-lg">
            Mensaje enviado.
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="py-3 px-6 bg-navy text-white font-semibold rounded-xl hover:bg-navy/90 active:scale-[0.98] transition-all disabled:opacity-60 font-body"
        >
          {pending ? 'Enviando...' : 'Enviar mensaje'}
        </button>
      </form>
    </div>
  )
}
