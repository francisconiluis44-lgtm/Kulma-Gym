'use client'

import { useActionState, useRef } from 'react'
import { createColaborador, removeColaborador } from './actions'

interface Colaborador {
  userId: string
  email: string
  nombre: string
}

function AddColaboradorForm() {
  const [state, formAction, isPending] = useActionState(createColaborador, null)
  const formRef = useRef<HTMLFormElement>(null)

  if (state?.ok) {
    formRef.current?.reset()
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm px-6 py-5">
      <p className="text-[11px] font-body font-semibold tracking-widest text-navy/40 uppercase mb-4">
        Agregar colaborador
      </p>
      <form ref={formRef} action={formAction} className="space-y-3">
        <div>
          <label className="block text-xs font-body font-semibold text-navy/60 mb-1">
            Nombre
          </label>
          <input
            name="nombre"
            type="text"
            required
            placeholder="Ej: María López"
            className="w-full rounded-xl border border-navy/10 bg-navy/[0.02] px-3.5 py-2.5 text-sm font-body text-navy placeholder:text-navy/30 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange/60 transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-body font-semibold text-navy/60 mb-1">
            Email
          </label>
          <input
            name="email"
            type="email"
            required
            placeholder="colaborador@email.com"
            className="w-full rounded-xl border border-navy/10 bg-navy/[0.02] px-3.5 py-2.5 text-sm font-body text-navy placeholder:text-navy/30 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange/60 transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-body font-semibold text-navy/60 mb-1">
            Contraseña
          </label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="Min. 8 caracteres"
            className="w-full rounded-xl border border-navy/10 bg-navy/[0.02] px-3.5 py-2.5 text-sm font-body text-navy placeholder:text-navy/30 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange/60 transition-all"
          />
        </div>

        {state?.error && (
          <p className="text-xs font-body text-red-500 bg-red-50 rounded-xl px-3.5 py-2.5">
            {state.error}
          </p>
        )}
        {state?.ok && (
          <p className="text-xs font-body text-emerald-600 bg-emerald-50 rounded-xl px-3.5 py-2.5">
            Colaborador agregado con exito.
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-orange text-white rounded-xl px-4 py-2.5 text-sm font-body font-semibold transition-all active:scale-[0.97] disabled:opacity-50"
        >
          {isPending ? 'Creando cuenta...' : 'Agregar colaborador'}
        </button>
      </form>
    </div>
  )
}

function ColaboradorRow({ colab }: { colab: Colaborador }) {
  async function handleRemove() {
    const ok = window.confirm(`Eliminar acceso de ${colab.nombre}? Esta accion no se puede deshacer.`)
    if (!ok) return
    const result = await removeColaborador(colab.userId)
    if (result?.error) alert(result.error)
  }

  return (
    <li className="flex items-center justify-between gap-3 py-3 border-b border-navy/5 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-body font-semibold text-navy truncate">{colab.nombre}</p>
        <p className="text-xs font-body text-navy/40 truncate">{colab.email}</p>
      </div>
      <button
        onClick={handleRemove}
        className="shrink-0 flex items-center gap-1.5 text-xs font-body font-semibold text-red-500 border border-red-200 hover:bg-red-50 active:scale-[0.93] active:bg-red-100 transition-all px-3 py-1.5 rounded-full"
      >
        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 16 16">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        Eliminar
      </button>
    </li>
  )
}

export default function ColaboradoresClient({ colaboradores }: { colaboradores: Colaborador[] }) {
  return (
    <div className="space-y-5">
      {colaboradores.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm px-6 py-5">
          <p className="text-[11px] font-body font-semibold tracking-widest text-navy/40 uppercase mb-4">
            Colaboradores activos ({colaboradores.length})
          </p>
          <ul>
            {colaboradores.map((c) => (
              <ColaboradorRow key={c.userId} colab={c} />
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm px-6 py-5">
          <p className="text-sm font-body text-navy/40">
            Todavia no tenes colaboradores. Agregá uno abajo.
          </p>
        </div>
      )}

      <AddColaboradorForm />
    </div>
  )
}
