'use client'

import { useActionState } from 'react'
import { actualizarDatosPerfil } from './actions'

type Props = {
  peso: number | null
  altura: number | null
  lesiones: string | null
  objetivo: string | null
  fecha_nacimiento: string | null
}

const OBJETIVOS = [
  { value: 'perder_peso', label: 'Perder peso' },
  { value: 'ganar_musculo', label: 'Ganar músculo' },
  { value: 'mantenerme', label: 'Mantenerme' },
  { value: 'otro', label: 'Otro' },
]

export default function DatosForm({ peso, altura, lesiones, objetivo, fecha_nacimiento }: Props) {
  const [state, formAction, pending] = useActionState(actualizarDatosPerfil, {
    error: null,
    ok: false,
  })

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-navy/50 font-body mb-1.5">Peso (kg)</label>
          <input
            name="peso"
            type="number"
            step="0.1"
            min="0"
            defaultValue={peso ?? ''}
            placeholder="70"
            className={inputCn}
          />
        </div>
        <div>
          <label className="block text-xs text-navy/50 font-body mb-1.5">Altura (cm)</label>
          <input
            name="altura"
            type="number"
            step="0.1"
            min="0"
            defaultValue={altura ?? ''}
            placeholder="170"
            className={inputCn}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-navy/50 font-body mb-1.5">Fecha de nacimiento</label>
        <input
          name="fecha_nacimiento"
          type="date"
          defaultValue={fecha_nacimiento ?? ''}
          className={inputCn}
        />
      </div>

      <div>
        <label className="block text-xs text-navy/50 font-body mb-1.5">Objetivo</label>
        <select
          name="objetivo"
          defaultValue={objetivo ?? ''}
          className={inputCn}
        >
          <option value="">— Sin especificar —</option>
          {OBJETIVOS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-navy/50 font-body mb-1.5">
          Lesiones o condiciones a tener en cuenta
        </label>
        <textarea
          name="lesiones"
          defaultValue={lesiones ?? ''}
          rows={3}
          placeholder="Ej: Lesión en rodilla derecha, hernia lumbar..."
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange text-navy font-body placeholder:text-gray-300 transition-colors resize-none text-sm"
        />
      </div>

      {state.error && (
        <p className="text-red-500 text-sm font-body bg-red-50 px-3 py-2 rounded-lg">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="text-green-600 text-sm font-body bg-green-50 px-3 py-2 rounded-lg">
          Datos guardados.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full py-3 bg-orange text-white font-semibold rounded-xl hover:bg-orange/90 active:scale-[0.98] transition-all disabled:opacity-60 font-body"
      >
        {pending ? 'Guardando...' : 'Guardar'}
      </button>
    </form>
  )
}

const inputCn =
  'w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange text-navy font-body placeholder:text-gray-300 transition-colors text-sm'
