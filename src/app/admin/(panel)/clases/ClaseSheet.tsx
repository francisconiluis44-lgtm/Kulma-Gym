'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { ClaseOcurrencia } from './types'
import { formatFechaLarga, formatHora, getTodayAR } from './dateUtils'
import {
  cancelarOcurrencia,
  crearExcepcionModificacion,
  aplicarCambioPermanente,
  previewCambioPermanente,
  getInscriptos,
} from './actions'

type Tab = 'info' | 'inscriptos' | 'editar'
type EditScope = 'puntual' | 'permanente'

type Props = {
  clase: ClaseOcurrencia
  diaNombre: string
  onClose: () => void
}

export default function ClaseSheet({ clase, diaNombre, onClose }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('info')
  const [isPending, startTransition] = useTransition()
  const sheetRef = useRef<HTMLDivElement>(null)

  // Inscriptos
  const [inscriptos, setInscriptos] = useState<{ id: string; nombre_completo: string; whatsapp: string | null }[] | null>(null)
  const [loadingInscriptos, setLoadingInscriptos] = useState(false)

  // Cancel confirmation
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  // Edit state
  const [editScope, setEditScope] = useState<EditScope | null>(null)
  const [editError, setEditError] = useState<string | null>(null)

  // Permanent change preview
  const [preview, setPreview] = useState<{ confirmadas: number } | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [confirmPermanente, setConfirmPermanente] = useState(false)

  // Form values for edit
  const [editValues, setEditValues] = useState({
    hora_inicio: formatHora(clase.hora_inicio),
    duracion_minutos: String(clase.duracion_minutos),
    cupo_maximo: String(clase.cupo_maximo),
    instructor: clase.instructor,
    descripcion: clase.descripcion ?? '',
  })

  useEffect(() => {
    if (tab === 'inscriptos' && inscriptos === null) {
      setLoadingInscriptos(true)
      getInscriptos(clase.serie_id, clase.excepcion_id, clase.fecha)
        .then(r => {
          if ('alumnos' in r) setInscriptos(r.alumnos)
        })
        .finally(() => setLoadingInscriptos(false))
    }
  }, [tab])

  function handleCancel() {
    if (!clase.serie_id) return
    setCancelError(null)
    startTransition(async () => {
      const r = await cancelarOcurrencia(clase.serie_id!, clase.fecha)
      if ('error' in r) {
        setCancelError(r.error)
      } else {
        router.refresh()
        onClose()
      }
    })
  }

  function handleEditPuntual(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!clase.serie_id) return
    setEditError(null)
    startTransition(async () => {
      const r = await crearExcepcionModificacion(clase.serie_id!, clase.fecha, {
        hora_inicio: editValues.hora_inicio || null,
        duracion_minutos: editValues.duracion_minutos ? parseInt(editValues.duracion_minutos) : null,
        cupo_maximo: editValues.cupo_maximo ? parseInt(editValues.cupo_maximo) : null,
        instructor: editValues.instructor || null,
        descripcion: editValues.descripcion || null,
      })
      if ('error' in r) {
        setEditError(r.error)
      } else {
        router.refresh()
        onClose()
      }
    })
  }

  async function loadPreview() {
    if (!clase.serie_id || !clase.version_id) return
    setPreviewLoading(true)
    const r = await previewCambioPermanente(clase.serie_id, clase.fecha)
    setPreviewLoading(false)
    if ('confirmadas' in r) setPreview(r)
  }

  function handleEditPermanente(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!clase.serie_id || !clase.dia_semana) return
    if (!confirmPermanente) {
      setConfirmPermanente(true)
      loadPreview()
      return
    }
    setEditError(null)
    startTransition(async () => {
      const r = await aplicarCambioPermanente(clase.serie_id!, clase.dia_semana!, clase.fecha, {
        hora_inicio: editValues.hora_inicio,
        duracion_minutos: parseInt(editValues.duracion_minutos),
        cupo_maximo: parseInt(editValues.cupo_maximo),
        instructor: editValues.instructor,
        descripcion: editValues.descripcion || null,
      })
      if ('error' in r) {
        setEditError(r.error)
      } else {
        router.refresh()
        onClose()
      }
    })
  }

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 font-body text-sm text-navy bg-white focus:outline-none focus:ring-2 focus:ring-orange/40'
  const labelCls = 'block text-xs font-body font-semibold text-navy/60 mb-1'
  const today = getTodayAR()
  const isPast = clase.fecha < today

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pt-2 pb-3 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-body text-navy/40 uppercase tracking-wide">{diaNombre} · {formatFechaLarga(clase.fecha)}</p>
              <p className="text-lg font-heading font-extrabold text-navy mt-0.5">{clase.nombre}</p>
              <p className="text-sm font-body text-navy/60">
                {formatHora(clase.hora_inicio)} · {clase.duracion_minutos}′ · {clase.instructor}
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1.5 rounded-xl text-navy/30 hover:text-navy hover:bg-navy/5 transition-colors mt-0.5"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Status badges */}
          <div className="flex items-center gap-2 mt-2">
            {clase.cancelada ? (
              <span className="text-xs font-body font-semibold px-2 py-1 rounded-full bg-red-100 text-red-500">Cancelada</span>
            ) : (
              <span className={`text-xs font-body font-semibold px-2 py-1 rounded-full ${
                clase.confirmadas >= clase.cupo_maximo ? 'bg-navy/10 text-navy/60' : 'bg-green-100 text-green-700'
              }`}>
                {clase.confirmadas}/{clase.cupo_maximo} inscriptos
              </span>
            )}
            {clase.es_especial && (
              <span className="text-xs font-body text-white bg-orange/80 rounded-full px-2 py-1 leading-none">especial</span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {(['info', 'inscriptos', 'editar'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              disabled={t === 'editar' && clase.es_especial}
              className={`flex-1 py-2.5 text-xs font-heading font-bold capitalize transition-colors disabled:opacity-30 ${
                tab === t ? 'text-orange border-b-2 border-orange -mb-px' : 'text-navy/40 hover:text-navy/60'
              }`}
            >
              {t === 'info' ? 'Detalle' : t === 'inscriptos' ? 'Inscriptos' : 'Editar'}
            </button>
          ))}
        </div>

        {/* Tab: Info */}
        {tab === 'info' && (
          <div className="px-5 py-5 space-y-4">
            {clase.descripcion && (
              <p className="text-sm font-body text-navy/70">{clase.descripcion}</p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-cream rounded-xl p-3">
                <p className="text-xs font-body text-navy/40">Hora</p>
                <p className="text-sm font-body font-semibold text-navy">{formatHora(clase.hora_inicio)}</p>
              </div>
              <div className="bg-cream rounded-xl p-3">
                <p className="text-xs font-body text-navy/40">Duración</p>
                <p className="text-sm font-body font-semibold text-navy">{clase.duracion_minutos} min</p>
              </div>
              <div className="bg-cream rounded-xl p-3">
                <p className="text-xs font-body text-navy/40">Instructor</p>
                <p className="text-sm font-body font-semibold text-navy">{clase.instructor}</p>
              </div>
              <div className="bg-cream rounded-xl p-3">
                <p className="text-xs font-body text-navy/40">Cupo</p>
                <p className="text-sm font-body font-semibold text-navy">{clase.confirmadas}/{clase.cupo_maximo}</p>
              </div>
            </div>

            {/* Cancel action (only for recurring, not cancelled, not past) */}
            {!clase.cancelada && !clase.es_especial && clase.serie_id && !isPast && (
              <div className="pt-2 border-t border-gray-100">
                {!confirmCancel ? (
                  <button
                    onClick={() => setConfirmCancel(true)}
                    className="w-full py-3 rounded-xl border border-red-200 text-red-500 text-sm font-heading font-bold hover:bg-red-50 transition-colors"
                  >
                    Cancelar esta clase
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-body text-navy text-center">
                      ¿Cancelar la clase del {formatFechaLarga(clase.fecha)}?
                    </p>
                    {clase.confirmadas > 0 && (
                      <p className="text-xs font-body text-orange text-center">
                        {clase.confirmadas} alumno{clase.confirmadas > 1 ? 's' : ''} tienen reserva.
                      </p>
                    )}
                    {cancelError && <p className="text-sm font-body text-red-500 text-center">{cancelError}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmCancel(false)}
                        className="flex-1 py-2.5 rounded-xl border border-gray-200 text-navy text-sm font-heading font-bold hover:bg-gray-50 transition-colors"
                      >
                        Volver
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={isPending}
                        className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-heading font-bold disabled:opacity-50 hover:bg-red-600 transition-colors"
                      >
                        {isPending ? 'Cancelando…' : 'Confirmar'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab: Inscriptos */}
        {tab === 'inscriptos' && (
          <div className="px-5 py-5">
            {loadingInscriptos ? (
              <p className="text-sm font-body text-navy/40 text-center py-8">Cargando…</p>
            ) : inscriptos === null ? (
              <p className="text-sm font-body text-red-400 text-center py-8">Error al cargar.</p>
            ) : inscriptos.length === 0 ? (
              <p className="text-sm font-body text-navy/40 text-center py-8">Sin inscriptos todavía.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-body text-navy/40 mb-3">
                  {inscriptos.length} alumno{inscriptos.length !== 1 ? 's' : ''} inscripto{inscriptos.length !== 1 ? 's' : ''}
                </p>
                {inscriptos.map(a => (
                  <div key={a.id} className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
                    <p className="text-sm font-body text-navy">{a.nombre_completo}</p>
                    {a.whatsapp && (
                      <a
                        href={`https://wa.me/${a.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-body text-green-600 hover:text-green-700"
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Editar */}
        {tab === 'editar' && !clase.es_especial && (
          <div className="px-5 py-5 space-y-4">
            {/* Scope selector */}
            {!editScope && (
              <div className="space-y-3">
                <p className="text-sm font-body text-navy/70">¿Qué querés modificar?</p>
                <button
                  onClick={() => setEditScope('puntual')}
                  className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-orange/40 hover:bg-orange/5 transition-colors"
                >
                  <p className="text-sm font-body font-semibold text-navy">Solo esta clase</p>
                  <p className="text-xs font-body text-navy/50 mt-0.5">
                    Cambio puntual para el {formatFechaLarga(clase.fecha)}
                  </p>
                </button>
                <button
                  onClick={() => setEditScope('permanente')}
                  className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-orange/40 hover:bg-orange/5 transition-colors"
                >
                  <p className="text-sm font-body font-semibold text-navy">Esta y todas las futuras</p>
                  <p className="text-xs font-body text-navy/50 mt-0.5">
                    Cambia el horario habitual desde esta fecha en adelante
                  </p>
                </button>
              </div>
            )}

            {/* Puntual form */}
            {editScope === 'puntual' && (
              <form onSubmit={handleEditPuntual} className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <button type="button" onClick={() => setEditScope(null)} className="text-navy/40 hover:text-navy">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <p className="text-xs font-heading font-bold text-navy/60 uppercase tracking-wide">
                    Solo el {formatFechaLarga(clase.fecha)}
                  </p>
                </div>

                <EditFields values={editValues} onChange={setEditValues} inputCls={inputCls} labelCls={labelCls} />

                {editError && <p className="text-sm font-body text-red-500">{editError}</p>}

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-3 rounded-xl bg-orange text-white text-sm font-heading font-bold disabled:opacity-50 transition-all active:scale-95"
                >
                  {isPending ? 'Guardando…' : 'Guardar cambio puntual'}
                </button>
              </form>
            )}

            {/* Permanente form */}
            {editScope === 'permanente' && !confirmPermanente && (
              <form onSubmit={handleEditPermanente} className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <button type="button" onClick={() => setEditScope(null)} className="text-navy/40 hover:text-navy">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <p className="text-xs font-heading font-bold text-navy/60 uppercase tracking-wide">
                    Desde {formatFechaLarga(clase.fecha)} en adelante
                  </p>
                </div>

                <EditFields values={editValues} onChange={setEditValues} inputCls={inputCls} labelCls={labelCls} />

                {editError && <p className="text-sm font-body text-red-500">{editError}</p>}

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-orange text-white text-sm font-heading font-bold transition-all active:scale-95"
                >
                  Revisar cambio permanente →
                </button>
              </form>
            )}

            {/* Permanente confirmation */}
            {editScope === 'permanente' && confirmPermanente && (
              <form onSubmit={handleEditPermanente} className="space-y-4">
                <div className="bg-orange/10 rounded-xl p-4 space-y-2">
                  <p className="text-sm font-heading font-bold text-navy">Confirmá el cambio permanente</p>
                  <p className="text-xs font-body text-navy/60">
                    Desde el {formatFechaLarga(clase.fecha)}, la clase "{clase.nombre}" los {diaNombre} pasará a:
                  </p>
                  <ul className="text-xs font-body text-navy space-y-1 mt-2">
                    <li>· Hora: <strong>{editValues.hora_inicio}</strong></li>
                    <li>· Duración: <strong>{editValues.duracion_minutos} min</strong></li>
                    <li>· Cupo: <strong>{editValues.cupo_maximo}</strong></li>
                    <li>· Instructor: <strong>{editValues.instructor}</strong></li>
                  </ul>
                  {previewLoading ? (
                    <p className="text-xs font-body text-navy/40 mt-2">Calculando reservas afectadas…</p>
                  ) : preview !== null && (
                    <p className="text-xs font-body font-semibold text-orange mt-2">
                      {preview.confirmadas > 0
                        ? `${preview.confirmadas} reserva${preview.confirmadas !== 1 ? 's' : ''} confirmada${preview.confirmadas !== 1 ? 's' : ''} serán afectadas.`
                        : 'No hay reservas confirmadas afectadas.'}
                    </p>
                  )}
                </div>

                {editError && <p className="text-sm font-body text-red-500">{editError}</p>}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmPermanente(false)}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-navy text-sm font-heading font-bold hover:bg-gray-50 transition-colors"
                  >
                    Volver
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || previewLoading}
                    className="flex-1 py-3 rounded-xl bg-navy text-white text-sm font-heading font-bold disabled:opacity-50 transition-all active:scale-95"
                  >
                    {isPending ? 'Aplicando…' : 'Aplicar cambio'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Safe bottom padding */}
        <div className="pb-8" />
      </div>
    </>
  )
}

function EditFields({
  values,
  onChange,
  inputCls,
  labelCls,
}: {
  values: { hora_inicio: string; duracion_minutos: string; cupo_maximo: string; instructor: string; descripcion: string }
  onChange: (v: typeof values) => void
  inputCls: string
  labelCls: string
}) {
  function set(k: keyof typeof values) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange({ ...values, [k]: e.target.value })
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Hora de inicio</label>
          <input type="time" value={values.hora_inicio} onChange={set('hora_inicio')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Duración (min)</label>
          <input type="number" min={15} max={300} value={values.duracion_minutos} onChange={set('duracion_minutos')} className={inputCls} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Instructor</label>
          <input type="text" value={values.instructor} onChange={set('instructor')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Cupo máximo</label>
          <input type="number" min={1} max={500} value={values.cupo_maximo} onChange={set('cupo_maximo')} className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Descripción</label>
        <textarea rows={2} value={values.descripcion} onChange={set('descripcion')} className={`${inputCls} resize-none`} />
      </div>
    </>
  )
}
