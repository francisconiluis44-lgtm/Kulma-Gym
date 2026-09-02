'use client'

import { useState, useTransition } from 'react'
import { archivarAlumno, desarchivarAlumno } from '../actions'

export default function ArchivarAlumnoBtn({
  alumnoId,
  alumnoNombre,
  archivado,
}: {
  alumnoId: string
  alumnoNombre: string
  archivado: boolean
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    setError('')
    startTransition(async () => {
      const res = archivado
        ? await desarchivarAlumno(alumnoId)
        : await archivarAlumno(alumnoId)
      if ('error' in res) {
        setError(res.error)
      } else {
        setConfirmOpen(false)
      }
    })
  }

  if (!confirmOpen) {
    return (
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="text-sm font-body font-semibold text-navy/60 hover:text-navy transition-colors underline-offset-2 hover:underline"
      >
        {archivado ? 'Desarchivar alumno' : 'Archivar alumno'}
      </button>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-body text-navy/70">
        {archivado
          ? `¿Querés desarchivar a ${alumnoNombre}? Va a volver a aparecer en el dashboard y las estadísticas.`
          : `¿Querés archivar a ${alumnoNombre}? No va a aparecer en el dashboard ni en las estadísticas hasta que vuelva a entrenar o se le registre un pago.`}
      </p>
      {error && <p className="text-sm font-body text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isPending}
          className="px-4 py-2 rounded-xl bg-navy text-white text-sm font-heading font-bold disabled:opacity-60 transition-colors hover:bg-navy/90"
        >
          {isPending ? 'Guardando...' : archivado ? 'Sí, desarchivar' : 'Sí, archivar'}
        </button>
        <button
          type="button"
          onClick={() => { setConfirmOpen(false); setError('') }}
          className="px-4 py-2 rounded-xl border border-gray-200 text-navy/60 text-sm font-heading font-bold hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
