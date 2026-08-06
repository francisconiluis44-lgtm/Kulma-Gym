'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { crearSerie } from '../actions'
import { getTodayAR } from '../dateUtils'

type Props = {
  diaSemana: number
  diaNombre: string
  onSuccess?: () => void
}

export default function NuevaSerieForm({ diaSemana, diaNombre, onSuccess }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const today = getTodayAR()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set('dia_semana', String(diaSemana))
    startTransition(async () => {
      const result = await crearSerie(formData)
      if ('error' in result) {
        setError(result.error)
      } else {
        router.refresh()
        onSuccess?.()
      }
    })
  }

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 font-body text-sm text-navy bg-white focus:outline-none focus:ring-2 focus:ring-orange/40'
  const labelCls = 'block text-xs font-body font-semibold text-navy/60 mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-xs font-heading font-bold text-orange uppercase tracking-wide">
        Nueva clase — {diaNombre}
      </p>

      <div>
        <label className={labelCls}>Nombre de la clase *</label>
        <input
          name="nombre"
          required
          placeholder="Ej: Funcional, Spinning, Yoga…"
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Hora de inicio *</label>
          <input
            name="hora_inicio"
            type="time"
            required
            defaultValue="09:00"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Duración (min) *</label>
          <input
            name="duracion_minutos"
            type="number"
            min={15}
            max={300}
            defaultValue={60}
            required
            className={inputCls}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Instructor *</label>
          <input
            name="instructor"
            required
            placeholder="Nombre del profe"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Cupo máximo *</label>
          <input
            name="cupo_maximo"
            type="number"
            min={1}
            max={500}
            defaultValue={20}
            required
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Rige desde *</label>
        <input
          name="fecha_desde"
          type="date"
          required
          defaultValue={today}
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Descripción (opcional)</label>
        <textarea
          name="descripcion"
          rows={2}
          placeholder="Ej: Traé ropa cómoda y botella de agua"
          className={`${inputCls} resize-none`}
        />
      </div>

      {error && <p className="text-sm font-body text-red-500">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onSuccess}
          className="flex-1 py-2.5 rounded-xl border border-navy/20 text-navy text-sm font-heading font-bold hover:bg-navy/5 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 py-2.5 rounded-xl bg-orange text-white text-sm font-heading font-bold transition-all active:scale-95 disabled:opacity-50"
        >
          {isPending ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}
