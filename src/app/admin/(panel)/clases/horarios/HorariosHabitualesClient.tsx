'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { formatHora } from '../dateUtils'
import NuevaSerieForm from './NuevaSerieForm'
import { editarVersionHorario, desactivarSerie } from '../actions'

type Version = {
  id: string
  serie_id: string
  dia_semana: number
  hora_inicio: string
  duracion_minutos: number
  cupo_maximo: number
  instructor: string
  descripcion: string | null
  fecha_desde: string
  clases_series: {
    id: string
    nombre: string
    activa: boolean
    gimnasio_id: string
  }
}

type Props = {
  porDia: Record<number, Version[] | undefined>
  diasSemana: string[]
}

// ── Formulario inline de edición ──────────────────────────────────────────
function EditarVersionForm({
  version,
  onSuccess,
  onCancel,
}: {
  version: Version
  onSuccess: () => void
  onCancel: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 font-body text-sm text-navy bg-white focus:outline-none focus:ring-2 focus:ring-orange/40'
  const labelCls = 'block text-xs font-body font-semibold text-navy/60 mb-1'

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const datos = {
      nombre:           (fd.get('nombre') as string).trim(),
      hora_inicio:      fd.get('hora_inicio') as string,
      duracion_minutos: parseInt(fd.get('duracion_minutos') as string, 10),
      cupo_maximo:      parseInt(fd.get('cupo_maximo') as string, 10),
      instructor:       (fd.get('instructor') as string).trim(),
      descripcion:      (fd.get('descripcion') as string)?.trim() || null,
    }
    startTransition(async () => {
      const result = await editarVersionHorario(version.id, datos)
      if ('error' in result) {
        setError(result.error)
      } else {
        router.refresh()
        onSuccess()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-xs font-heading font-bold text-orange uppercase tracking-wide">
        Editar clase
      </p>

      <div>
        <label className={labelCls}>Nombre de la clase *</label>
        <input
          name="nombre"
          required
          defaultValue={version.clases_series.nombre}
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Hora de inicio *</label>
          <input
            name="hora_inicio"
            type="time"
            required
            defaultValue={version.hora_inicio.slice(0, 5)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Duración (min) *</label>
          <input
            name="duracion_minutos"
            type="number"
            min={15}
            max={300}
            required
            defaultValue={version.duracion_minutos}
            className={inputCls}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Instructor *</label>
          <input
            name="instructor"
            required
            defaultValue={version.instructor}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Cupo máximo *</label>
          <input
            name="cupo_maximo"
            type="number"
            min={1}
            max={500}
            required
            defaultValue={version.cupo_maximo}
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Descripción (opcional)</label>
        <textarea
          name="descripcion"
          rows={2}
          defaultValue={version.descripcion ?? ''}
          className={`${inputCls} resize-none`}
        />
      </div>

      {error && <p className="text-sm font-body text-red-500">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-navy/20 text-navy text-sm font-heading font-bold hover:bg-navy/5 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 py-2.5 rounded-xl bg-orange text-white text-sm font-heading font-bold transition-all active:scale-95 disabled:opacity-50"
        >
          {isPending ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}

// ── Confirmación inline de eliminación ────────────────────────────────────
function ConfirmarEliminar({
  version,
  onCancel,
  onEliminated,
}: {
  version: Version
  onCancel: () => void
  onEliminated: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleEliminar() {
    setError(null)
    startTransition(async () => {
      const result = await desactivarSerie(version.serie_id)
      if ('error' in result) {
        setError(result.error)
      } else {
        router.refresh()
        onEliminated()
      }
    })
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-body text-navy/70">
        ¿Eliminar <strong className="text-navy">{version.clases_series.nombre}</strong> de los horarios? Se cancelarán las reservas futuras.
      </p>
      {error && <p className="text-xs font-body text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          disabled={isPending}
          className="flex-1 py-2 rounded-xl border border-navy/20 text-navy text-xs font-heading font-bold hover:bg-navy/5 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleEliminar}
          disabled={isPending}
          className="flex-1 py-2 rounded-xl bg-red-500 text-white text-xs font-heading font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Eliminando…' : 'Sí, eliminar'}
        </button>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────
export default function HorariosHabitualesClient({ porDia, diasSemana }: Props) {
  const [formDia, setFormDia] = useState<number | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)

  function closeAll() {
    setFormDia(null)
    setEditandoId(null)
    setEliminandoId(null)
  }

  function handleAddClick(dow: number, showForm: boolean) {
    if (showForm) {
      setFormDia(null)
    } else {
      closeAll()
      setFormDia(dow)
    }
  }

  function handleEditClick(versionId: string) {
    if (editandoId === versionId) {
      setEditandoId(null)
    } else {
      closeAll()
      setEditandoId(versionId)
    }
  }

  function handleDeleteClick(versionId: string) {
    if (eliminandoId === versionId) {
      setEliminandoId(null)
    } else {
      closeAll()
      setEliminandoId(versionId)
    }
  }

  return (
    <div className="space-y-3">
      {diasSemana.map((dia, idx) => {
        const dow = idx + 1
        const clases = porDia[dow] ?? []
        const showForm = formDia === dow

        return (
          <div key={dow} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <p className="text-sm font-heading font-bold text-navy">{dia}</p>
              <button
                onClick={() => handleAddClick(dow, showForm)}
                className="text-xs font-body font-semibold text-orange hover:text-orange/80 transition-colors flex items-center gap-1"
              >
                {showForm ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancelar
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Agregar
                  </>
                )}
              </button>
            </div>

            {clases.length === 0 && !showForm && (
              <p className="px-5 py-4 text-xs font-body text-navy/30 italic">Sin clases este día</p>
            )}

            {clases.map((v, i) => {
              const isEditing  = editandoId  === v.id
              const isDeleting = eliminandoId === v.id

              return (
                <div key={v.id} className={i > 0 ? 'border-t border-gray-50' : ''}>
                  {/* Fila principal */}
                  <div className="flex items-center gap-4 px-5 py-3">
                    <div className="flex-shrink-0 w-12 text-center">
                      <p className="text-sm font-heading font-extrabold text-navy tabular-nums">
                        {formatHora(v.hora_inicio)}
                      </p>
                      <p className="text-xs font-body text-navy/40">{v.duracion_minutos}′</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body font-semibold text-navy truncate">
                        {v.clases_series.nombre}
                      </p>
                      <p className="text-xs font-body text-navy/50 truncate">{v.instructor}</p>
                    </div>
                    <div className="flex-shrink-0 text-right mr-2">
                      <span className="text-xs font-body text-navy/40 tabular-nums">
                        {v.cupo_maximo} cupos
                      </span>
                    </div>
                    {/* Botones editar / eliminar */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleEditClick(v.id)}
                        title="Editar"
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                          isEditing ? 'bg-orange/20 text-orange' : 'hover:bg-navy/5 text-navy/30 hover:text-navy/60'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(v.id)}
                        title="Eliminar"
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                          isDeleting ? 'bg-red-100 text-red-500' : 'hover:bg-red-50 text-navy/30 hover:text-red-400'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Formulario de edición inline */}
                  {isEditing && (
                    <div className="border-t border-orange/20 bg-orange/5 px-5 py-4">
                      <EditarVersionForm
                        version={v}
                        onSuccess={closeAll}
                        onCancel={closeAll}
                      />
                    </div>
                  )}

                  {/* Confirmación de eliminación inline */}
                  {isDeleting && (
                    <div className="border-t border-red-100 bg-red-50 px-5 py-4">
                      <ConfirmarEliminar
                        version={v}
                        onCancel={closeAll}
                        onEliminated={closeAll}
                      />
                    </div>
                  )}
                </div>
              )
            })}

            {showForm && (
              <div className="border-t border-orange/20 bg-orange/5 px-5 py-4">
                <NuevaSerieForm
                  diaSemana={dow}
                  diaNombre={dia}
                  onSuccess={closeAll}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
