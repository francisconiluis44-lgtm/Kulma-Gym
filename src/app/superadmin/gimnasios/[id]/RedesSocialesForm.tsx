'use client'
import { useActionState } from 'react'
import { guardarRedesSociales } from './actions'

const initial = { error: null as string | null, ok: false }

export default function RedesSocialesForm({
  gimnasioId,
  facebookUrl,
  instagramUrl,
  instagramSuplementosUrl,
}: {
  gimnasioId: string
  facebookUrl: string | null
  instagramUrl: string | null
  instagramSuplementosUrl: string | null
}) {
  const [state, formAction, pending] = useActionState(guardarRedesSociales, initial)

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="gimnasio_id" value={gimnasioId} />

      <div>
        <label className="block text-xs font-semibold font-body text-white/40 uppercase tracking-widest mb-1.5">
          Facebook
        </label>
        <input
          type="url"
          name="facebook_url"
          defaultValue={facebookUrl ?? ''}
          placeholder="https://facebook.com/tugym"
          className="w-full bg-gray-800 border border-gray-700 text-white font-body text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-orange placeholder-white/20"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold font-body text-white/40 uppercase tracking-widest mb-1.5">
          Instagram
        </label>
        <input
          type="url"
          name="instagram_url"
          defaultValue={instagramUrl ?? ''}
          placeholder="https://instagram.com/tugym"
          className="w-full bg-gray-800 border border-gray-700 text-white font-body text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-orange placeholder-white/20"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold font-body text-white/40 uppercase tracking-widest mb-1.5">
          Link secundario (opcional)
        </label>
        <input
          type="url"
          name="instagram_suplementos_url"
          defaultValue={instagramSuplementosUrl ?? ''}
          placeholder="https://instagram.com/tutienda"
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
        {pending ? 'Guardando…' : 'Guardar redes'}
      </button>
    </form>
  )
}
