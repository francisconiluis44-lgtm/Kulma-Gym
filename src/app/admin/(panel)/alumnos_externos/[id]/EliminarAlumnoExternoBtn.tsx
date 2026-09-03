'use client'

import { useState, useTransition } from 'react'
import { eliminarAlumnoExterno } from '../../alumnos/actions'

export default function EliminarAlumnoExternoBtn({
  externoId,
  externoNombre,
}: {
  externoId: string
  externoNombre: string
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    setError('')
    startTransition(async () => {
      const result = await eliminarAlumnoExterno(externoId)
      if ('error' in result) {
        setError(result.error)
        return
      }
      window.location.href = '/admin/alumnos'
    })
  }

  if (!confirmOpen) {
    return (
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="px-4 py-2.5 rounded-xl border border-red-200 text-red-500 font-heading font-bold text-sm hover:bg-red-50 transition-colors"
      >
        Eliminar alumno
      </button>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-body text-navy/70">
        <strong className="text-navy font-semibold">{externoNombre}</strong> será eliminado de forma permanente junto con sus asistencias y cobros. Esta acción no se puede deshacer.
      </p>
      {error && <p className="text-sm font-body text-red-500">{error}</p>}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isPending}
          className="flex-1 px-4 py-2.5 bg-red-500 text-white font-body font-semibold text-sm rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Eliminando…' : 'Sí, eliminar'}
        </button>
        <button
          type="button"
          onClick={() => setConfirmOpen(false)}
          className="px-5 py-2.5 rounded-xl border border-gray-200 text-navy/60 font-heading font-bold text-sm hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
