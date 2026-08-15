'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ClaseOcurrencia } from './types'
import { DIAS_CORTOS, DIAS_SEMANA } from './types'
import { formatHora, formatFechaLarga } from './dateUtils'
import ClaseSheet from './ClaseSheet'
import ClaseEspecialForm from './ClaseEspecialForm'

type Props = {
  ocurrencias: ClaseOcurrencia[]
  fechas: string[]       // 7 ISO dates Mon-Sun
  hoy: string
  offset: number
  semanaLabel: string
}

export default function CalendarioSemanal({ ocurrencias, fechas, hoy, offset, semanaLabel }: Props) {
  const router = useRouter()
  const [selectedDow, setSelectedDow] = useState<number>(() => {
    const todayIdx = fechas.indexOf(hoy)
    return todayIdx >= 0 ? todayIdx : 0
  })
  const [selectedClase, setSelectedClase] = useState<ClaseOcurrencia | null>(null)
  const [showEspecialForm, setShowEspecialForm] = useState(false)

  const fechaSeleccionada = fechas[selectedDow]!
  const clasesDelDia = ocurrencias.filter(o => o.fecha === fechaSeleccionada)

  function navWeek(delta: number) {
    const newOffset = offset + delta
    router.push(newOffset === 0 ? '/admin/clases' : `/admin/clases?offset=${newOffset}`)
  }

  return (
    <>
      {/* Week navigation */}
      <div className="flex items-center justify-between gap-2 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
        <button
          onClick={() => navWeek(-1)}
          className="p-2 rounded-xl text-navy/40 hover:text-navy hover:bg-navy/5 active:scale-95 transition-all"
          aria-label="Semana anterior"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <p className="text-sm font-body font-semibold text-navy capitalize">{semanaLabel}</p>
          {offset === 0 && (
            <p className="text-[11px] font-body text-orange font-semibold mt-0.5 uppercase tracking-wide">Esta semana</p>
          )}
        </div>
        <button
          onClick={() => navWeek(1)}
          className="p-2 rounded-xl text-navy/40 hover:text-navy hover:bg-navy/5 active:scale-95 transition-all"
          aria-label="Semana siguiente"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {fechas.map((fecha, idx) => {
            const isHoy = fecha === hoy
            const isSelected = idx === selectedDow
            const dayNum = new Date(fecha + 'T12:00:00Z').getUTCDate()
            const count = ocurrencias.filter(o => o.fecha === fecha && !o.cancelada).length

            return (
              <button
                key={fecha}
                onClick={() => setSelectedDow(idx)}
                className={`flex-1 flex flex-col items-center py-3 text-center transition-all duration-150 relative ${
                  isSelected
                    ? 'text-orange bg-orange/[0.04]'
                    : isHoy
                    ? 'text-navy hover:bg-navy/[0.02]'
                    : 'text-navy/40 hover:text-navy/60 hover:bg-navy/[0.02]'
                }`}
              >
                <span className={`text-[10px] font-body font-semibold uppercase tracking-wide ${isSelected ? 'text-orange' : ''}`}>{DIAS_CORTOS[idx]}</span>
                <span className={`text-sm font-heading font-extrabold tabular-nums mt-0.5 w-7 h-7 flex items-center justify-center rounded-full transition-all ${
                  isSelected ? 'bg-orange text-white shadow-sm' : isHoy ? 'bg-navy/10 text-navy' : ''
                }`}>
                  {dayNum}
                </span>
                {count > 0 ? (
                  <span className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? 'bg-orange' : 'bg-navy/20'}`} />
                ) : (
                  <span className="mt-1 h-1.5" />
                )}
                {isSelected && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-orange" />
                )}
              </button>
            )
          })}
        </div>

        {/* Classes for selected day */}
        <div className="min-h-[200px]">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <p className="text-xs font-body font-semibold text-navy/50 capitalize">
              {formatFechaLarga(fechaSeleccionada)}
            </p>
            <button
              onClick={() => setShowEspecialForm(true)}
              className="text-xs font-body font-semibold text-orange hover:text-orange/80 transition-colors flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-orange/8 active:scale-95"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Clase especial
            </button>
          </div>

          {clasesDelDia.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-navy/5 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-navy/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-navy/30 font-body text-sm">Sin clases este día</p>
              <p className="text-navy/20 font-body text-xs mt-1">
                Agregá horarios en{' '}
                <a href="/admin/clases/horarios" className="text-orange/60 hover:text-orange underline">
                  Horarios habituales
                </a>
              </p>
            </div>
          ) : (
            <div className="px-3 py-3 space-y-2">
              {clasesDelDia.map(clase => {
                const pct = clase.cupo_maximo > 0 ? Math.round((clase.confirmadas / clase.cupo_maximo) * 100) : 0
                const isFull = clase.cupo_maximo > 0 && clase.confirmadas >= clase.cupo_maximo
                const isAlmostFull = !isFull && pct >= 75
                const stripCn = clase.cancelada
                  ? 'bg-red-400'
                  : isFull
                  ? 'bg-slate-300'
                  : isAlmostFull
                  ? 'bg-orange'
                  : 'bg-emerald-400'
                return (
                  <button
                    key={`${clase.serie_id ?? clase.excepcion_id}|${clase.fecha}`}
                    onClick={() => setSelectedClase(clase)}
                    className={`w-full flex items-stretch text-left rounded-xl border border-gray-100 bg-gray-50/40 hover:bg-white hover:shadow-md hover:border-gray-200 active:scale-[0.99] active:shadow-none transition-all duration-150 overflow-hidden ${clase.cancelada ? 'opacity-55' : ''}`}
                  >
                    {/* Status strip */}
                    <div className={`w-[3.5px] shrink-0 ${stripCn}`} />

                    {/* Content */}
                    <div className="flex-1 flex items-start gap-3 px-4 py-3">
                      {/* Time column */}
                      <div className="shrink-0 w-11 text-center pt-0.5">
                        <p className={`text-[15px] font-heading font-extrabold tabular-nums leading-tight ${clase.cancelada ? 'text-navy/30 line-through' : 'text-navy'}`}>
                          {formatHora(clase.hora_inicio)}
                        </p>
                        <p className="text-[11px] font-body text-navy/35 mt-0.5">{clase.duracion_minutos}′</p>
                      </div>

                      {/* Info column */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className={`text-[13px] font-body font-semibold truncate leading-snug ${clase.cancelada ? 'text-navy/40 line-through' : 'text-navy'}`}>
                            {clase.nombre}
                          </p>
                          {clase.es_especial && (
                            <span className="flex-shrink-0 text-[10px] font-body text-white bg-orange/80 rounded-full px-1.5 py-0.5 leading-none uppercase tracking-wide">
                              especial
                            </span>
                          )}
                        </div>
                        {clase.instructor && (
                          <p className="text-xs font-body text-navy/40 truncate mb-1.5">{clase.instructor}</p>
                        )}
                        {/* Capacity bar */}
                        {!clase.cancelada && clase.cupo_maximo > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-[3px] bg-gray-200 rounded-full overflow-hidden max-w-[72px]">
                              <div
                                className={`h-full rounded-full transition-all ${isFull ? 'bg-slate-300' : isAlmostFull ? 'bg-orange' : 'bg-emerald-400'}`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                            <span className={`text-[11px] font-body tabular-nums font-semibold ${isFull ? 'text-navy/40' : isAlmostFull ? 'text-orange' : 'text-emerald-600'}`}>
                              {clase.confirmadas}/{clase.cupo_maximo}
                            </span>
                          </div>
                        )}
                        {clase.cancelada && (
                          <span className="inline-block text-xs font-body font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-500">
                            Cancelada
                          </span>
                        )}
                      </div>

                      {/* Chevron */}
                      <div className="shrink-0 self-center">
                        <svg className="w-4 h-4 text-navy/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Class detail sheet */}
      {selectedClase && (
        <ClaseSheet
          clase={selectedClase}
          onClose={() => setSelectedClase(null)}
          diaNombre={DIAS_SEMANA[(selectedClase.dia_semana ?? 1) - 1] ?? ''}
        />
      )}

      {/* Special class form */}
      {showEspecialForm && (
        <ClaseEspecialForm
          fechaDefault={fechaSeleccionada}
          onClose={() => setShowEspecialForm(false)}
        />
      )}
    </>
  )
}
