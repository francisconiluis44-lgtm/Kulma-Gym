'use client'

import { useActionState, useState } from 'react'
import { actualizarAlumno, subirRutinaPdf } from './actions'

type Props = {
  alumnoId: string
  rutina_url: string | null
  fecha_vencimiento: string | null
  rutina_fecha_vencimiento: string | null
}

export default function EditarForm({
  alumnoId,
  rutina_url,
  fecha_vencimiento,
  rutina_fecha_vencimiento,
}: Props) {
  const boundAction = actualizarAlumno.bind(null, alumnoId)
  const [state, formAction, pending] = useActionState(boundAction, { error: null, ok: false })

  const [rutinaUrl, setRutinaUrl] = useState(rutina_url ?? '')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadOk, setUploadOk] = useState(false)

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('El archivo no puede superar los 10 MB')
      return
    }
    setUploading(true)
    setUploadError(null)
    setUploadOk(false)
    const fd = new FormData()
    fd.append('pdf', file)
    const { error, url } = await subirRutinaPdf(alumnoId, fd)
    setUploading(false)
    if (error) {
      setUploadError(error)
    } else if (url) {
      setRutinaUrl(url)
      setUploadOk(true)
    }
  }

  const isDriveLink = rutinaUrl.includes('drive.google')

  return (
    <form action={formAction} className="space-y-5">
      {/* Hidden input que lleva la URL al Server Action */}
      <input type="hidden" name="rutina_url" value={rutinaUrl} readOnly />

      <div className="border-b border-gray-100 pb-5 space-y-4">
        <p className="text-xs font-semibold font-body text-navy/40 uppercase tracking-widest">
          Rutina
        </p>

        {/* Upload PDF */}
        <div>
          <label className="block text-sm font-medium text-navy/80 mb-2 font-body">
            PDF de rutina
          </label>
          <label className={`inline-flex items-center gap-2 cursor-pointer px-4 py-2.5 border rounded-xl text-sm font-semibold font-body transition-colors ${uploading ? 'border-gray-200 text-navy/40' : 'border-orange text-orange hover:bg-orange/5'}`}>
            <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 shrink-0">
              <path d="M8 10V2M5 5L8 2l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 11v1a2 2 0 002 2h8a2 2 0 002-2v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {uploading ? 'Subiendo…' : rutinaUrl ? 'Reemplazar PDF' : 'Subir PDF de rutina'}
            <input
              type="file"
              accept="application/pdf"
              onChange={handlePdfUpload}
              className="sr-only"
              disabled={uploading}
            />
          </label>

          {rutinaUrl && !uploadOk && (
            <p className="mt-1.5 text-xs text-navy/40 font-body">
              {isDriveLink ? '🔗 Link de Google Drive activo' : '📄 PDF subido'}
            </p>
          )}
          {uploadOk && (
            <p className="mt-1.5 text-xs text-green-600 font-body">
              PDF subido. Guardá los cambios para aplicarlo.
            </p>
          )}
          {uploadError && (
            <p className="mt-1.5 text-xs text-red-500 font-body">{uploadError}</p>
          )}
        </div>

        {/* Link externo (fallback / retrocompatibilidad) */}
        <div>
          <label className="block text-xs font-medium text-navy/40 mb-1.5 font-body uppercase tracking-widest">
            O pegar un link externo
          </label>
          <input
            type="url"
            value={rutinaUrl}
            onChange={(e) => { setRutinaUrl(e.target.value); setUploadOk(false) }}
            placeholder="https://drive.google.com/…"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange text-navy font-body placeholder:text-gray-300 transition-colors text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-navy/80 mb-1.5 font-body">
            Vencimiento de la rutina
          </label>
          <input
            name="rutina_fecha_vencimiento"
            type="date"
            defaultValue={rutina_fecha_vencimiento ?? ''}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange text-navy font-body transition-colors"
          />
        </div>
      </div>

      <div className="space-y-5">
        <p className="text-xs font-semibold font-body text-navy/40 uppercase tracking-widest">
          Membresía
        </p>
        <div>
          <label className="block text-sm font-medium text-navy/80 mb-1.5 font-body">
            Fecha de vencimiento
          </label>
          <input
            name="fecha_vencimiento"
            type="date"
            defaultValue={fecha_vencimiento ?? ''}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange text-navy font-body transition-colors"
          />
        </div>
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
        disabled={pending || uploading}
        className="w-full py-3 bg-orange text-white font-semibold rounded-xl hover:bg-orange/90 active:scale-[0.98] transition-all disabled:opacity-60 font-body"
      >
        {pending ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </form>
  )
}
