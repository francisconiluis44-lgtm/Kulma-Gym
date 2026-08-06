'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { crearClaseEspecial } from './actions'

type Props = {
  fechaDefault: string
  onClose: () => void
}

export default function ClaseEspecialForm({ fechaDefault, onClose }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const r = await crearClaseEspecial(formData)
      if ('error' in r) {
        setError(r.error)
      } else {
        router.refresh()
        onClose()
      }
    })
  }

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 font-body text-sm text-navy bg-white focus:outline-none focus:ring-2 focus:ring-orange/40'
  const labelCls = 'block text-xs font-body font-semibold text-navy/60 mb-1'

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-5 pt-2 pb-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-body text-orange uppercase tracking-wide font-semibold">Clase especial</p>
            <p className="text-lg font-heading font-extrabold text-navy mt-0.5">Nueva clase puntual</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-navy/30 hover:text-navy hover:bg-navy/5 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-3">
          <div>
            <label className={labelCls}>Nombre *</label>
            <input name="nombre" required placeholder="Ej: Workshop de Pilates" className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Fecha *</label>
              <input name="fecha" type="date" required defaultValue={fechaDefault} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Hora *</label>
              <input name="hora_inicio" type="time" required defaultValue="09:00" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Duración (min) *</label>
              <input name="duracion_minutos" type="number" min={15} max={300} defaultValue={60} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Cupo máximo *</label>
              <input name="cupo_maximo" type="number" min={1} max={500} defaultValue={20} required className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Instructor *</label>
            <input name="instructor" required placeholder="Nombre del profe" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Descripción (opcional)</label>
            <textarea name="descripcion" rows={2} className={`${inputCls} resize-none`} />
          </div>

          {error && <p className="text-sm font-body text-red-500">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-navy/20 text-navy text-sm font-heading font-bold hover:bg-navy/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-3 rounded-xl bg-orange text-white text-sm font-heading font-bold disabled:opacity-50 transition-all active:scale-95"
            >
              {isPending ? 'Creando…' : 'Crear clase'}
            </button>
          </div>
        </form>

        <div className="pb-8" />
      </div>
    </>
  )
}
