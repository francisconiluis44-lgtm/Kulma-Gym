'use client'

import { useActionState, useRef, useState } from 'react'
import { crearCarpeta } from './actions'

export default function NuevaCarpetaForm() {
  const [state, formAction, pending] = useActionState(crearCarpeta, { error: null })
  const formRef = useRef<HTMLFormElement>(null)
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-orange text-white text-sm font-semibold font-body px-4 py-2.5 rounded-xl hover:bg-orange/90 active:scale-95 transition-all"
      >
        + Nueva carpeta
      </button>
    )
  }

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        await formAction(fd)
        formRef.current?.reset()
        setOpen(false)
      }}
      className="bg-gray-900 border border-gray-800 rounded-2xl px-5 py-4 flex flex-col sm:flex-row gap-3 sm:items-center"
    >
      <input
        name="nombre"
        type="text"
        required
        autoFocus
        placeholder="Ej: Suplementos, Promociones..."
        className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-orange/60 text-white font-body placeholder:text-white/30 transition-colors"
      />
      <div className="flex gap-2 shrink-0">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 sm:flex-none px-4 py-2.5 bg-orange text-white font-semibold rounded-xl hover:bg-orange/90 active:scale-95 transition-all disabled:opacity-60 font-body text-sm"
        >
          {pending ? 'Creando...' : 'Crear'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2.5 text-white/50 hover:text-white font-body text-sm transition-colors"
        >
          Cancelar
        </button>
      </div>
      {state.error && (
        <p className="text-red-400 text-sm font-body basis-full">{state.error}</p>
      )}
    </form>
  )
}
