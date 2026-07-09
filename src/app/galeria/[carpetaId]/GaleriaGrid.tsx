'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { registrarArchivo, eliminarArchivos } from '../actions'

type Item = {
  id: string
  tipo: 'imagen' | 'video'
  nombreOriginal: string
  url: string
}

export default function GaleriaGrid({
  carpetaId,
  carpetaNombre,
  items,
}: {
  carpetaId: string
  carpetaNombre: string
  items: Item[]
}) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selecting = selected.size > 0

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setError(null)
    setUploading({ done: 0, total: files.length })

    const supabase = createClient()

    for (const file of files) {
      const esVideo = file.type.startsWith('video/')
      const tipo: 'imagen' | 'video' = esVideo ? 'video' : 'imagen'
      const ext = file.name.split('.').pop() || (esVideo ? 'mp4' : 'jpg')
      const path = `${carpetaId}/${crypto.randomUUID()}.${ext}`

      const { error: uploadError } = await supabase.storage.from('galeria').upload(path, file, {
        contentType: file.type || undefined,
      })

      if (uploadError) {
        setError(`No se pudo subir "${file.name}": ${uploadError.message}`)
        continue
      }

      try {
        await registrarArchivo(carpetaId, path, tipo, file.name)
      } catch {
        setError(`No se pudo registrar "${file.name}".`)
      }

      setUploading((prev) => (prev ? { done: prev.done + 1, total: prev.total } : prev))
    }

    setUploading(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    router.refresh()
  }

  async function selectedAsFiles(): Promise<File[]> {
    const chosen = items.filter((i) => selected.has(i.id))
    const files: File[] = []
    for (const item of chosen) {
      const res = await fetch(item.url)
      const blob = await res.blob()
      files.push(new File([blob], item.nombreOriginal, { type: blob.type }))
    }
    return files
  }

  async function handleShare() {
    setBusy(true)
    setError(null)
    try {
      const files = await selectedAsFiles()
      if (navigator.canShare && navigator.canShare({ files })) {
        await navigator.share({ files, title: carpetaNombre })
      } else {
        downloadFiles(files)
        setError('Tu navegador no soporta compartir archivos directamente — se descargaron en su lugar.')
      }
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        setError('No se pudo compartir. Probá descargando los archivos.')
      }
    } finally {
      setBusy(false)
    }
  }

  function downloadFiles(files: File[]) {
    for (const file of files) {
      const url = URL.createObjectURL(file)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    }
  }

  async function handleDownload() {
    setBusy(true)
    setError(null)
    try {
      const files = await selectedAsFiles()
      downloadFiles(files)
    } catch {
      setError('No se pudieron descargar los archivos.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Eliminar ${selected.size} archivo(s)? Esta acción no se puede deshacer.`)) {
      return
    }
    setBusy(true)
    setError(null)
    try {
      await eliminarArchivos(carpetaId, Array.from(selected))
      setSelected(new Set())
      router.refresh()
    } catch {
      setError('No se pudieron eliminar los archivos.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="pb-24">
      <div className="flex items-center gap-3 mb-4">
        <label className="bg-orange text-white text-sm font-semibold font-body px-4 py-2.5 rounded-xl hover:bg-orange/90 active:scale-95 transition-all cursor-pointer">
          {uploading ? `Subiendo ${uploading.done}/${uploading.total}...` : '+ Subir fotos o videos'}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleUpload}
            disabled={!!uploading}
            className="hidden"
          />
        </label>
        {selecting && (
          <button
            onClick={() => setSelected(new Set())}
            className="text-sm text-white/50 hover:text-white font-body transition-colors"
          >
            Cancelar selección
          </button>
        )}
      </div>

      {error && (
        <p className="text-red-400 text-sm font-body bg-red-400/10 px-3 py-2 rounded-lg mb-4">{error}</p>
      )}

      {items.length === 0 ? (
        <p className="text-white/30 font-body text-sm text-center py-16">
          No hay archivos todavía. Subí la primera foto o video.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {items.map((item) => {
            const isSelected = selected.has(item.id)
            return (
              <button
                key={item.id}
                onClick={() => toggleSelect(item.id)}
                className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-colors ${
                  isSelected ? 'border-orange' : 'border-transparent'
                }`}
              >
                {item.tipo === 'imagen' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt={item.nombreOriginal} className="w-full h-full object-cover" />
                ) : (
                  <>
                    <video src={item.url} muted playsInline preload="metadata" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1.5 right-1.5 text-xs bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center">
                      ▶
                    </span>
                  </>
                )}
                <span
                  className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs transition-colors ${
                    isSelected ? 'bg-orange border-orange text-white' : 'bg-black/30 border-white/60'
                  }`}
                >
                  {isSelected ? '✓' : ''}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {selecting && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            <span className="text-sm text-white/60 font-body shrink-0">{selected.size} seleccionada(s)</span>
            <div className="flex-1" />
            <button
              onClick={handleDownload}
              disabled={busy}
              className="text-sm font-semibold font-body text-white/70 hover:text-white px-3 py-2 rounded-xl hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Descargar
            </button>
            <button
              onClick={handleShare}
              disabled={busy}
              className="text-sm font-semibold font-body bg-orange text-white px-4 py-2 rounded-xl hover:bg-orange/90 active:scale-95 transition-all disabled:opacity-50"
            >
              Compartir
            </button>
            <button
              onClick={handleDelete}
              disabled={busy}
              className="text-sm font-semibold font-body text-red-400 hover:text-red-300 px-3 py-2 rounded-xl hover:bg-red-400/10 transition-colors disabled:opacity-50"
            >
              Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
