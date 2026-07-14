'use client'

import { useState, useTransition } from 'react'
import { eliminarComunicado } from './actions'

interface Comunicado {
  id: string
  titulo: string
  cuerpo: string
  created_at: string
}

export default function ComunicadosList({ comunicados }: { comunicados: Comunicado[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const [isPending, startTransition] = useTransition()

  function openModal(id: string) {
    setPendingId(id)
    setConfirmText('')
  }

  function closeModal() {
    if (isPending) return
    setPendingId(null)
    setConfirmText('')
  }

  function handleEliminar() {
    if (!pendingId || confirmText !== 'ELIMINAR') return
    startTransition(async () => {
      await eliminarComunicado(pendingId)
      setPendingId(null)
      setConfirmText('')
    })
  }

  if (comunicados.length === 0) {
    return (
      <p className="text-navy/40 font-body text-sm text-center py-8">
        No hay comunicados todavía.
      </p>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {comunicados.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-2xl shadow-sm px-6 py-5 flex gap-4 items-start"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs text-navy/40 font-body mb-1 tabular-nums">
                {new Date(c.created_at).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <h3 className="font-heading font-semibold text-navy mb-1">{c.titulo}</h3>
              <p className="text-sm text-navy/70 font-body whitespace-pre-wrap">{c.cuerpo}</p>
            </div>
            <button
              onClick={() => openModal(c.id)}
              className="text-xs text-red-400 hover:text-red-600 font-body transition-colors shrink-0 mt-1"
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>

      {/* Modal de confirmación */}
      {pendingId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className="bg-white rounded-2xl shadow-xl px-6 py-7 w-full max-w-sm">
            <p className="text-2xl mb-3 text-center">⚠️</p>
            <h3 className="text-lg font-heading font-bold text-navy text-center mb-2">
              Eliminar comunicado
            </h3>
            <p className="text-sm text-navy/60 font-body text-center mb-5 leading-relaxed">
              Esta acción es <strong>irreversible</strong>. El comunicado será eliminado
              permanentemente y los alumnos ya no podrán verlo.
            </p>
            <p className="text-sm font-body text-navy/80 mb-2">
              Escribí <strong className="font-mono">ELIMINAR</strong> para confirmar:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="ELIMINAR"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 text-navy font-mono mb-4 transition-colors"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleEliminar() }}
            />
            <div className="flex gap-3">
              <button
                onClick={closeModal}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-navy/70 font-body text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminar}
                disabled={confirmText !== 'ELIMINAR' || isPending}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold font-body text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
