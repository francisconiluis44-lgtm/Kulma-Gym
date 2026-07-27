'use client'

import { useActionState, useRef, useEffect, useState } from 'react'
import { enviarMensajeAAlumno } from './actions'

type Alumno = { id: string; nombre_completo: string }

export default function NuevoMensajeForm({ alumnos }: { alumnos: Alumno[] }) {
  const [state, formAction, pending] = useActionState(enviarMensajeAAlumno, {
    error: null,
    ok: false,
  })
  const formRef = useRef<HTMLFormElement>(null)

  const [q, setQ] = useState('')
  const [alumnoId, setAlumnoId] = useState('')
  const [alumnoNombre, setAlumnoNombre] = useState('')

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset()
      setAlumnoId('')
      setAlumnoNombre('')
      setQ('')
    }
  }, [state.ok])

  const resultados = q.trim().length === 0 ? [] : alumnos.filter(a =>
    a.nombre_completo.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(
      q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    )
  ).slice(0, 8)

  function seleccionar(a: Alumno) {
    setAlumnoId(a.id)
    setAlumnoNombre(a.nombre_completo)
    setQ('')
  }

  function limpiar() {
    setAlumnoId('')
    setAlumnoNombre('')
    setQ('')
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm px-6 py-6 mb-8">
      <h3 className="text-lg font-heading font-semibold text-navy mb-4">
        Nuevo mensaje a alumno
      </h3>
      <form ref={formRef} action={formAction} className="space-y-3">
        <input type="hidden" name="alumno_id" value={alumnoId} />

        {alumnoId ? (
          <div className="flex items-center justify-between px-4 py-3 bg-navy/5 rounded-xl border border-navy/15">
            <span className="font-body text-sm text-navy font-semibold">{alumnoNombre}</span>
            <button type="button" onClick={limpiar} className="text-xs font-body text-navy/40 hover:text-navy/70 transition-colors">
              Cambiar
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              type="text"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Buscá por nombre o apellido…"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange/40 text-navy font-body text-sm placeholder:text-navy/30 transition-colors bg-white"
            />
            {resultados.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 bg-white border border-navy/10 rounded-xl shadow-lg overflow-hidden">
                {resultados.map(a => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => seleccionar(a)}
                      className="w-full text-left px-4 py-2.5 text-sm font-body text-navy hover:bg-orange/5 transition-colors border-b border-navy/5 last:border-0"
                    >
                      {a.nombre_completo}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {q.trim().length >= 2 && resultados.length === 0 && (
              <p className="mt-2 text-xs font-body text-navy/40 px-1">Sin resultados para &ldquo;{q}&rdquo;</p>
            )}
          </div>
        )}

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
          disabled={pending || !alumnoId}
          className="py-3 px-6 bg-navy text-white font-semibold rounded-xl hover:bg-navy/90 active:scale-[0.98] transition-all disabled:opacity-60 font-body"
        >
          {pending ? 'Enviando...' : 'Enviar mensaje'}
        </button>
      </form>
    </div>
  )
}
