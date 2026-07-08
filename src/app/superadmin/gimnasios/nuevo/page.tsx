'use client'
import { useActionState } from 'react'
import { crearGimnasio } from './actions'

const initial = { error: null as string | null, ok: false }

export default function NuevoGimnasioPage() {
  const [state, formAction, pending] = useActionState(crearGimnasio, initial)

  return (
    <>
      <h2 className="text-2xl font-heading font-bold text-white mb-6">Nuevo gimnasio</h2>

      {state.ok ? (
        <div className="bg-green-900/30 border border-green-700 text-green-300 rounded-2xl px-5 py-4 font-body text-sm">
          Gimnasio creado correctamente.
        </div>
      ) : (
        <form action={formAction} className="bg-gray-900 border border-gray-800 rounded-2xl px-6 py-6 max-w-md space-y-4">
          <div>
            <label className="block text-xs font-semibold font-body text-white/50 uppercase tracking-widest mb-1.5">
              Nombre
            </label>
            <input
              name="nombre"
              required
              placeholder="Ej: Fitness Center Norte"
              className="w-full bg-gray-800 border border-gray-700 text-white font-body text-sm rounded-xl px-4 py-3 placeholder-white/20 focus:outline-none focus:border-orange"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold font-body text-white/50 uppercase tracking-widest mb-1.5">
              Slug (URL única)
            </label>
            <input
              name="slug"
              required
              placeholder="Ej: fitness-norte"
              pattern="[a-z0-9-]+"
              className="w-full bg-gray-800 border border-gray-700 text-white font-body text-sm rounded-xl px-4 py-3 placeholder-white/20 focus:outline-none focus:border-orange"
            />
            <p className="text-xs text-white/30 font-body mt-1">Solo minúsculas, números y guiones.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold font-body text-white/50 uppercase tracking-widest mb-1.5">
              Plan
            </label>
            <select
              name="plan"
              className="w-full bg-gray-800 border border-gray-700 text-white font-body text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-orange"
            >
              <option value="basico">Básico</option>
              <option value="pro">Pro</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold font-body text-white/50 uppercase tracking-widest mb-1.5">
              Email del admin (opcional)
            </label>
            <input
              name="admin_email"
              type="email"
              placeholder="admin@nuevogym.com"
              className="w-full bg-gray-800 border border-gray-700 text-white font-body text-sm rounded-xl px-4 py-3 placeholder-white/20 focus:outline-none focus:border-orange"
            />
            <p className="text-xs text-white/30 font-body mt-1">
              Si el usuario ya existe en la plataforma, queda vinculado como admin del gimnasio.
            </p>
          </div>

          {state.error && (
            <p className="text-red-400 font-body text-sm">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-orange text-white font-semibold font-body text-sm py-3 rounded-xl hover:bg-orange/90 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {pending ? 'Creando…' : 'Crear gimnasio'}
          </button>
        </form>
      )}
    </>
  )
}
