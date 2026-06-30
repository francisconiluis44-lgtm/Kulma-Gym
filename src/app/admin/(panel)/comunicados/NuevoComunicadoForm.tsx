'use client'

import { useActionState, useRef } from 'react'
import { publicarComunicado } from './actions'

export default function NuevoComunicadoForm() {
  const [state, formAction, pending] = useActionState(publicarComunicado, {
    error: null,
    ok: false,
  })
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        await formAction(fd)
        formRef.current?.reset()
      }}
      className="bg-white rounded-2xl shadow-sm px-6 py-6 space-y-4 mb-8"
    >
      <h3 className="text-lg font-heading font-semibold text-navy">
        Nuevo comunicado
      </h3>

      <div>
        <label className="block text-sm font-medium text-navy/80 mb-1.5 font-body">
          Título
        </label>
        <input
          name="titulo"
          type="text"
          required
          placeholder="Ej: Feriado lunes 25"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange text-navy font-body placeholder:text-gray-300 transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-navy/80 mb-1.5 font-body">
          Contenido
        </label>
        <textarea
          name="cuerpo"
          required
          rows={4}
          placeholder="Escribí el mensaje para los alumnos..."
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange text-navy font-body placeholder:text-gray-300 transition-colors resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-navy/80 mb-1.5 font-body">
          Imagen <span className="text-navy/40 font-normal">(opcional)</span>
        </label>
        <input
          name="imagen"
          type="file"
          accept="image/*"
          className="w-full text-sm text-navy/70 font-body file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange/10 file:text-orange hover:file:bg-orange/20 file:transition-colors cursor-pointer"
        />
      </div>

      {state.error && (
        <p className="text-red-500 text-sm font-body bg-red-50 px-3 py-2 rounded-lg">
          {state.error}
        </p>
      )}

      {state.ok && (
        <p className="text-green-600 text-sm font-body bg-green-50 px-3 py-2 rounded-lg">
          Comunicado publicado.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="py-3 px-6 bg-orange text-white font-semibold rounded-xl hover:bg-orange/90 active:scale-[0.98] transition-all disabled:opacity-60 font-body"
      >
        {pending ? 'Publicando...' : 'Publicar'}
      </button>
    </form>
  )
}
