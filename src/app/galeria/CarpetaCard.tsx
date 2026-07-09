'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import type { GaleriaCarpeta } from '@/types/database'
import { renombrarCarpeta, eliminarCarpeta } from './actions'

export default function CarpetaCard({
  carpeta,
  cantidad,
}: {
  carpeta: GaleriaCarpeta
  cantidad: number
}) {
  const [isPending, startTransition] = useTransition()

  function handleRename(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const nuevo = window.prompt('Nuevo nombre de la carpeta', carpeta.nombre)
    if (nuevo && nuevo.trim() && nuevo.trim() !== carpeta.nombre) {
      startTransition(() => {
        renombrarCarpeta(carpeta.id, nuevo.trim())
      })
    }
  }

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const msg =
      cantidad > 0
        ? `Eliminar "${carpeta.nombre}" y sus ${cantidad} archivo(s)? Esta acción no se puede deshacer.`
        : `Eliminar la carpeta "${carpeta.nombre}"?`
    if (window.confirm(msg)) {
      startTransition(() => {
        eliminarCarpeta(carpeta.id)
      })
    }
  }

  return (
    <Link
      href={`/galeria/${carpeta.id}`}
      className={`group bg-gray-900 border border-gray-800 rounded-2xl px-4 py-4 flex flex-col gap-2 hover:border-orange/40 transition-colors ${
        isPending ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-2xl">🗂️</span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleRename}
            aria-label="Renombrar"
            className="text-xs text-white/40 hover:text-white transition-colors px-1.5 py-1 rounded-md hover:bg-white/5"
          >
            ✏️
          </button>
          <button
            onClick={handleDelete}
            aria-label="Eliminar"
            className="text-xs text-white/40 hover:text-red-400 transition-colors px-1.5 py-1 rounded-md hover:bg-white/5"
          >
            🗑️
          </button>
        </div>
      </div>
      <div>
        <p className="font-heading font-semibold text-white text-sm truncate">{carpeta.nombre}</p>
        <p className="text-xs text-white/40 font-body">
          {cantidad} {cantidad === 1 ? 'archivo' : 'archivos'}
        </p>
      </div>
    </Link>
  )
}
