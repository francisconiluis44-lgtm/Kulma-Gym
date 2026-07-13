'use client'

import { useActionState } from 'react'
import { guardarColores } from './actions'

type Props = {
  color_primario: string | null
  color_acento: string | null
}

const COLORES_PRIMARIOS = [
  { value: '#1B2A4A', label: 'Navy' },
  { value: '#1a1a2e', label: 'Midnight' },
  { value: '#0f3460', label: 'Azul real' },
  { value: '#16213e', label: 'Azul oscuro' },
  { value: '#2d3748', label: 'Gris pizarra' },
  { value: '#1a202c', label: 'Grafito' },
  { value: '#2c1810', label: 'Café oscuro' },
  { value: '#1b4332', label: 'Verde bosque' },
  { value: '#312e81', label: 'Índigo' },
  { value: '#4a1942', label: 'Morado' },
]

const COLORES_ACENTO = [
  { value: '#FF6B2B', label: 'Naranja' },
  { value: '#e63946', label: 'Rojo' },
  { value: '#f4a261', label: 'Durazno' },
  { value: '#2ec4b6', label: 'Turquesa' },
  { value: '#06d6a0', label: 'Verde menta' },
  { value: '#ffd166', label: 'Amarillo' },
  { value: '#4cc9f0', label: 'Celeste' },
  { value: '#7209b7', label: 'Violeta' },
  { value: '#f72585', label: 'Fucsia' },
  { value: '#3a86ff', label: 'Azul eléctrico' },
]

function ColorPicker({
  name,
  value,
  opciones,
}: {
  name: string
  value: string
  opciones: { value: string; label: string }[]
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {opciones.map((c) => (
        <label key={c.value} className="cursor-pointer" title={c.label}>
          <input
            type="radio"
            name={name}
            value={c.value}
            defaultChecked={value === c.value}
            className="sr-only peer"
          />
          <span
            className="block w-8 h-8 rounded-full ring-2 ring-transparent peer-checked:ring-offset-2 peer-checked:ring-navy transition-all hover:scale-110"
            style={{ backgroundColor: c.value }}
          />
        </label>
      ))}
    </div>
  )
}

export default function ColoresForm({ color_primario, color_acento }: Props) {
  const [state, formAction, pending] = useActionState(guardarColores, {
    error: null,
    ok: false,
  })

  const primario = color_primario ?? '#1B2A4A'
  const acento = color_acento ?? '#FF6B2B'

  return (
    <form action={formAction} className="bg-white rounded-2xl shadow-sm px-6 py-6 max-w-lg space-y-6">
      <div>
        <p className="text-xs font-body font-semibold tracking-widest text-orange uppercase mb-4">
          Colores del gimnasio
        </p>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-navy/80 mb-2 font-body">
              Color principal
            </label>
            <ColorPicker name="color_primario" value={primario} opciones={COLORES_PRIMARIOS} />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy/80 mb-2 font-body">
              Color de acento
            </label>
            <ColorPicker name="color_acento" value={acento} opciones={COLORES_ACENTO} />
          </div>
        </div>
      </div>

      {state.error && (
        <p className="text-red-500 text-sm font-body bg-red-50 px-3 py-2 rounded-lg">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="text-green-600 text-sm font-body bg-green-50 px-3 py-2 rounded-lg">
          Colores guardados.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full py-3 bg-orange text-white font-semibold rounded-xl hover:bg-orange/90 active:scale-[0.98] transition-all disabled:opacity-60 font-body"
      >
        {pending ? 'Guardando...' : 'Guardar colores'}
      </button>
    </form>
  )
}
