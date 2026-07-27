'use client'

import { useActionState } from 'react'
import { guardarLogos } from './actions'

export default function LogoForm({
  logoUrl,
  logoHeaderUrl,
}: {
  logoUrl: string | null
  logoHeaderUrl: string | null
}) {
  const [state, formAction, pending] = useActionState(guardarLogos, { error: null, ok: false })

  return (
    <form action={formAction} className="bg-white rounded-2xl shadow-sm px-6 py-6 max-w-lg space-y-5">
      <p className="text-xs font-body font-semibold tracking-widest text-orange uppercase">
        Logos
      </p>

      <div>
        <label className="block text-sm font-medium text-navy/80 mb-1.5 font-body">
          Logo de login (cuadrado)
        </label>
        <input
          type="url"
          name="logo_url"
          defaultValue={logoUrl ?? ''}
          placeholder="https://…/logo.png"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange text-navy font-body text-sm placeholder:text-gray-300 transition-colors"
        />
        <p className="text-xs text-navy/40 font-body mt-1">Se muestra en la pantalla de ingreso de alumnos.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-navy/80 mb-1.5 font-body">
          Logo del header (horizontal)
        </label>
        <input
          type="url"
          name="logo_header_url"
          defaultValue={logoHeaderUrl ?? ''}
          placeholder="https://…/logo-horizontal.png"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange text-navy font-body text-sm placeholder:text-gray-300 transition-colors"
        />
        <p className="text-xs text-navy/40 font-body mt-1">Se muestra en el header del panel y en el dashboard del alumno.</p>
      </div>

      {state.error && (
        <p className="text-red-500 text-sm font-body bg-red-50 px-3 py-2 rounded-lg">{state.error}</p>
      )}
      {state.ok && (
        <p className="text-green-600 text-sm font-body bg-green-50 px-3 py-2 rounded-lg">Guardado correctamente.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full py-3 bg-orange text-white font-semibold rounded-xl hover:bg-orange/90 active:scale-[0.98] transition-all disabled:opacity-60 font-body"
      >
        {pending ? 'Guardando...' : 'Guardar logos'}
      </button>
    </form>
  )
}
