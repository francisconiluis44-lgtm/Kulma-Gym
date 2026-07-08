'use client'
import { useActionState } from 'react'
import { solicitarAcceso } from './actions'

const initial = { error: null as string | null, ok: false }

export default function SolicitarAdminPage() {
  const [state, formAction, pending] = useActionState(solicitarAcceso, initial)

  if (state.ok) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-heading font-bold text-white mb-2">Solicitud enviada</h2>
          <p className="text-white/60 font-body text-sm">
            El propietario revisará tu solicitud y recibirás un email con el acceso.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-xs font-body font-semibold tracking-widest text-orange uppercase mb-1">
            Acceso admin
          </p>
          <h1 className="text-2xl font-heading font-extrabold text-white leading-tight">
            Solicitá acceso
          </h1>
          <p className="text-white/50 text-sm font-body mt-2">
            El propietario del gimnasio aprueba tu solicitud.
          </p>
        </div>

        <form action={formAction} className="bg-white/5 border border-white/10 rounded-2xl px-8 py-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5 font-body">Nombre completo</label>
            <input
              name="nombre"
              required
              placeholder="Tu nombre"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-orange/60 text-white font-body placeholder:text-white/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5 font-body">Email</label>
            <input
              name="email"
              type="email"
              required
              placeholder="tu@email.com"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-orange/60 text-white font-body placeholder:text-white/30"
            />
          </div>

          {state.error && (
            <p className="text-red-400 text-sm font-body bg-red-400/10 px-3 py-2 rounded-lg">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full py-3 bg-orange text-white font-semibold rounded-xl hover:bg-orange/90 active:scale-[0.98] transition-all disabled:opacity-60 font-body"
          >
            {pending ? 'Enviando…' : 'Enviar solicitud'}
          </button>
        </form>
      </div>
    </div>
  )
}
