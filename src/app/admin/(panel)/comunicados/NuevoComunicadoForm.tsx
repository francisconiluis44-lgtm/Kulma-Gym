'use client'

import { useActionState, useRef, useState } from 'react'
import { publicarComunicado } from './actions'

interface Props {
  totalAlumnos: number
}

type Preview = { titulo: string; cuerpo: string; fd: FormData }

export default function NuevoComunicadoForm({ totalAlumnos }: Props) {
  const [state, formAction, pending] = useActionState(publicarComunicado, {
    error: null,
    ok: false,
  })
  const formRef = useRef<HTMLFormElement>(null)
  const [preview, setPreview] = useState<Preview | null>(null)

  function handlePreviewClick() {
    const form = formRef.current
    if (!form) return
    if (!form.reportValidity()) return
    const fd = new FormData(form)
    const titulo = (fd.get('titulo') as string)?.trim()
    const cuerpo = (fd.get('cuerpo') as string)?.trim()
    if (!titulo || !cuerpo) return
    setPreview({ titulo, cuerpo, fd })
  }

  async function handleConfirm() {
    if (!preview) return
    const fd = preview.fd
    setPreview(null)
    await formAction(fd)
    formRef.current?.reset()
  }

  return (
    <>
      <form
        ref={formRef}
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
          type="button"
          onClick={handlePreviewClick}
          disabled={pending}
          className="py-3 px-6 bg-orange text-white font-semibold rounded-xl hover:bg-orange/90 active:scale-[0.98] transition-all disabled:opacity-60 font-body"
        >
          {pending ? 'Publicando...' : 'Publicar'}
        </button>
      </form>

      {/* Modal de preview antes de publicar */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl px-6 py-7 w-full max-w-sm">
            <p className="text-xs font-body font-semibold tracking-widest text-orange uppercase mb-4">
              Vista previa
            </p>
            <h3 className="font-heading font-bold text-navy text-lg mb-2 leading-snug">
              {preview.titulo}
            </h3>
            <p className="text-sm text-navy/70 font-body whitespace-pre-wrap mb-5 leading-relaxed">
              {preview.cuerpo}
            </p>
            <div className="bg-orange/10 rounded-xl px-4 py-3 mb-5">
              <p className="text-sm font-body text-navy/70">
                Este comunicado se enviará a{' '}
                <strong className="text-navy">
                  {totalAlumnos} {totalAlumnos === 1 ? 'alumno' : 'alumnos'}
                </strong>{' '}
                con una notificación push.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setPreview(null)}
                disabled={pending}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-navy/70 font-body text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={pending}
                className="flex-1 py-2.5 rounded-xl bg-orange hover:bg-orange/90 text-white font-semibold font-body text-sm transition-colors disabled:opacity-50"
              >
                {pending ? 'Publicando...' : 'Sí, enviar ahora'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
