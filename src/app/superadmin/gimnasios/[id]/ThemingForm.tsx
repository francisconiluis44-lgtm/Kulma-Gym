'use client'
import { useActionState } from 'react'
import { actualizarTheming } from './actions'

const initial = { error: null as string | null, ok: false }

export default function ThemingForm({
  gimnasioId,
  colorPrimario,
  colorAcento,
  logoUrl,
}: {
  gimnasioId: string
  colorPrimario: string
  colorAcento: string
  logoUrl: string | null
}) {
  const [state, formAction, pending] = useActionState(actualizarTheming, initial)

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="gimnasio_id" value={gimnasioId} />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold font-body text-white/40 uppercase tracking-widest mb-1.5">
            Color primario
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              name="color_primario"
              defaultValue={colorPrimario}
              className="w-10 h-10 rounded-lg border border-gray-700 bg-transparent cursor-pointer"
            />
            <input
              type="text"
              name="color_primario"
              defaultValue={colorPrimario}
              placeholder="#0D1B3E"
              className="flex-1 bg-gray-800 border border-gray-700 text-white font-body text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-orange"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold font-body text-white/40 uppercase tracking-widest mb-1.5">
            Color acento
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              name="color_acento"
              defaultValue={colorAcento}
              className="w-10 h-10 rounded-lg border border-gray-700 bg-transparent cursor-pointer"
            />
            <input
              type="text"
              name="color_acento"
              defaultValue={colorAcento}
              placeholder="#F26419"
              className="flex-1 bg-gray-800 border border-gray-700 text-white font-body text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-orange"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold font-body text-white/40 uppercase tracking-widest mb-1.5">
          URL del logo (opcional)
        </label>
        <input
          type="url"
          name="logo_url"
          defaultValue={logoUrl ?? ''}
          placeholder="https://…/logo.png"
          className="w-full bg-gray-800 border border-gray-700 text-white font-body text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-orange placeholder-white/20"
        />
      </div>

      {state.error && <p className="text-red-400 text-xs font-body">{state.error}</p>}
      {state.ok && <p className="text-green-400 text-xs font-body">¡Guardado!</p>}

      <button
        type="submit"
        disabled={pending}
        className="bg-orange text-white text-xs font-semibold font-body px-4 py-2 rounded-lg hover:bg-orange/90 active:scale-95 transition-all disabled:opacity-50"
      >
        {pending ? 'Guardando…' : 'Guardar theming'}
      </button>
    </form>
  )
}
