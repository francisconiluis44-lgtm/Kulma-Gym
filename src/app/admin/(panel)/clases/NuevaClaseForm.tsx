'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { crearClase } from './actions'

export default function NuevaClaseForm() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const manana = new Date()
  manana.setDate(manana.getDate() + 1)
  const defaultDT = manana.toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }) + 'T09:00'

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await crearClase(formData)
      if ('error' in result) {
        setError(result.error)
      } else {
        router.push(`/admin/clases/${result.id}`)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-body font-semibold text-navy/60 mb-1">Título *</label>
        <input
          name="titulo"
          required
          defaultValue="Clase grupal"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 font-body text-sm text-navy focus:outline-none focus:ring-2 focus:ring-orange/40"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-body font-semibold text-navy/60 mb-1">Fecha y hora *</label>
          <input
            name="fecha_hora"
            type="datetime-local"
            required
            defaultValue={defaultDT}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 font-body text-sm text-navy focus:outline-none focus:ring-2 focus:ring-orange/40"
          />
        </div>
        <div>
          <label className="block text-xs font-body font-semibold text-navy/60 mb-1">Duración (min)</label>
          <input
            name="duracion_min"
            type="number"
            min={15}
            max={300}
            defaultValue={60}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 font-body text-sm text-navy focus:outline-none focus:ring-2 focus:ring-orange/40"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-body font-semibold text-navy/60 mb-1">Instructor</label>
          <input
            name="instructor"
            placeholder="Nombre del profe"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 font-body text-sm text-navy focus:outline-none focus:ring-2 focus:ring-orange/40 placeholder:text-navy/30"
          />
        </div>
        <div>
          <label className="block text-xs font-body font-semibold text-navy/60 mb-1">Cupo máximo</label>
          <input
            name="capacidad_max"
            type="number"
            min={1}
            max={500}
            defaultValue={20}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 font-body text-sm text-navy focus:outline-none focus:ring-2 focus:ring-orange/40"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-body font-semibold text-navy/60 mb-1">Descripción (opcional)</label>
        <textarea
          name="descripcion"
          rows={2}
          placeholder="Ej: Traer toalla y ropa cómoda"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 font-body text-sm text-navy focus:outline-none focus:ring-2 focus:ring-orange/40 placeholder:text-navy/30 resize-none"
        />
      </div>

      {error && <p className="text-sm font-body text-red-500">{error}</p>}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={() => router.push('/admin/clases')}
          className="flex-1 py-3 rounded-xl border border-navy/20 text-navy text-sm font-heading font-bold hover:bg-navy/5 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 py-3 rounded-xl bg-orange text-white text-sm font-heading font-bold transition-all active:scale-95 disabled:opacity-50"
        >
          {isPending ? 'Creando...' : 'Crear clase'}
        </button>
      </div>
    </form>
  )
}
