'use client'

import { useActionState } from 'react'
import { actualizarAlumno } from './actions'

type Props = {
  alumnoId: string
  rutina_url: string | null
  fecha_vencimiento: string | null
}

export default function EditarForm({ alumnoId, rutina_url, fecha_vencimiento }: Props) {
  const boundAction = actualizarAlumno.bind(null, alumnoId)
  const [state, formAction, pending] = useActionState(boundAction, {
    error: null,
    ok: false,
  })

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-navy/80 mb-1.5 font-body">
          Link de rutina (Google Drive)
        </label>
        <input
          name="rutina_url"
          type="url"
          defaultValue={rutina_url ?? ''}
          placeholder="https://drive.google.com/..."
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange text-navy font-body placeholder:text-gray-300 transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-navy/80 mb-1.5 font-body">
          Fecha de vencimiento
        </label>
        <input
          name="fecha_vencimiento"
          type="date"
          defaultValue={fecha_vencimiento ?? ''}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange text-navy font-body transition-colors"
        />
      </div>

      {state.error && (
        <p className="text-red-500 text-sm font-body bg-red-50 px-3 py-2 rounded-lg">
          {state.error}
        </p>
      )}

      {state.ok && (
        <p className="text-green-600 text-sm font-body bg-green-50 px-3 py-2 rounded-lg">
          Guardado correctamente.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full py-3 bg-orange text-white font-semibold rounded-xl hover:bg-orange/90 active:scale-[0.98] transition-all disabled:opacity-60 font-body"
      >
        {pending ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  )
}
