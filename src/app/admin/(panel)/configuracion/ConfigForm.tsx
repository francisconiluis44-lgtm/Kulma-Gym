'use client'

import { useActionState } from 'react'
import { guardarConfiguracion } from './actions'

type Props = {
  facebook_url: string | null
  instagram_url: string | null
  instagram_suplementos_url: string | null
}

export default function ConfigForm({ facebook_url, instagram_url, instagram_suplementos_url }: Props) {
  const [state, formAction, pending] = useActionState(guardarConfiguracion, {
    error: null,
    ok: false,
  })

  return (
    <form action={formAction} className="bg-white rounded-2xl shadow-sm px-6 py-6 max-w-lg space-y-5">
      <div>
        <label className="block text-sm font-medium text-navy/80 mb-1.5 font-body">
          Facebook
        </label>
        <input
          name="facebook_url"
          type="url"
          defaultValue={facebook_url ?? ''}
          placeholder="https://facebook.com/kulmagym"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange text-navy font-body placeholder:text-gray-300 transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-navy/80 mb-1.5 font-body">
          Instagram
        </label>
        <input
          name="instagram_url"
          type="url"
          defaultValue={instagram_url ?? ''}
          placeholder="https://instagram.com/kulmagym"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange text-navy font-body placeholder:text-gray-300 transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-navy/80 mb-1.5 font-body">
          Instagram suplementos
        </label>
        <input
          name="instagram_suplementos_url"
          type="url"
          defaultValue={instagram_suplementos_url ?? ''}
          placeholder="https://instagram.com/kulmagym.suplementos"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange text-navy font-body placeholder:text-gray-300 transition-colors"
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
        {pending ? 'Guardando...' : 'Guardar'}
      </button>
    </form>
  )
}
