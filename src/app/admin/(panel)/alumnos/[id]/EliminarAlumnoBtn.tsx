'use client'

import { useState, useTransition } from 'react'
import { eliminarAlumno } from './actions'

export default function EliminarAlumnoBtn({
  alumnoId,
  alumnoNombre,
}: {
  alumnoId: string
  alumnoNombre: string
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleEliminar() {
    setError(null)
    startTransition(async () => {
      const result = await eliminarAlumno(alumnoId)
      if (result && 'error' in result) {
        setError(result.error)
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm font-body font-semibold text-red-500 hover:text-red-700 transition-colors"
      >
        Eliminar alumno
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget && !isPending) setOpen(false) }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm px-6 py-6">
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-heading font-bold text-navy">¿Eliminar alumno?</h3>
              <p className="text-sm font-body text-navy/60 mt-1 leading-snug">
                <strong className="text-navy font-semibold">{alumnoNombre}</strong> será eliminado de forma permanente.
                Se borrarán sus asistencias, cobros, reservas y mensajes.
                Esta acción no se puede deshacer.
              </p>
            </div>

            {error && (
              <p className="text-sm font-body text-red-500 text-center mb-3">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setOpen(false); setError(null) }}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-navy font-body font-semibold text-sm rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminar}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white font-body font-semibold text-sm rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isPending ? 'Eliminando…' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
