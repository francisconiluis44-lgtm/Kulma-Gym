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
      <div className="flex items-center justify-between gap-2 bg-white rounded-2xl shadow-sm px-4 py-3">
        <button
          onClick={() => navWeek(-1)}
          className="p-1.5 rounded-lg text-navy/40 hover:text-navy hover:bg-navy/5 transition-colors"
          aria-label="Semana anterior"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <p className="text-xs font-body font-semibold text-navy/50 capitalize">{semanaLabel}</p>
          {offset === 0 && (
            <p className="text-xs font-body text-orange font-bold mt-0.5">Esta semana</p>
          )}
        </div>
        <button
          onClick={() => navWeek(1)}
          className="p-1.5 rounded-lg text-navy/40 hover:text-navy hover:bg-navy/5 transition-colors"
          aria-label="Semana siguiente"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day tabs */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
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
                className={`flex-1 flex flex-col items-center py-2.5 text-center transition-colors relative ${
                  isSelected
                    ? 'text-orange'
                    : isHoy
                    ? 'text-navy'
                    : 'text-navy/40 hover:text-navy/60'
                }`}
              >
                <span className="text-xs font-body font-semibold">{DIAS_CORTOS[idx]}</span>
                <span className={`text-sm font-heading font-extrabold tabular-nums mt-0.5 w-7 h-7 flex items-center justify-center rounded-full ${
                  isSelected ? 'bg-orange text-white' : isHoy ? 'bg-navy/10' : ''
                }`}>
                  {dayNum}
                </span>
                {count > 0 && (
                  <span className={`text-xs font-body mt-0.5 ${isSelected ? 'text-orange' : 'text-navy/30'}`}>
                    {count}
                  </span>
                )}
                {isSelected && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange" />
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
              className="text-xs font-body font-semibold text-orange hover:text-orange/80 transition-colors flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Clase especial
            </button>
          </div>

          {clasesDelDia.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-navy/30 font-body text-sm">Sin clases este día</p>
              <p className="text-navy/20 font-body text-xs mt-1">
                Agregá horarios en{' '}
                <a
                  href="/admin/clases/horarios"
                  className="text-orange/60 hover:text-orange underline"
                >
                  Horarios habituales
                </a>
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {clasesDelDia.map(clase => (
                <button
                  key={`${clase.serie_id ?? clase.excepcion_id}|${clase.fecha}`}
                  onClick={() => setSelectedClase(clase)}
                  className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-navy/[0.02] transition-colors text-left"
                >
                  <div className="flex-shrink-0 w-12 text-center">
                    <p className={`text-sm font-heading font-extrabold tabular-nums ${clase.cancelada ? 'text-navy/30 line-through' : 'text-navy'}`}>
                      {formatHora(clase.hora_inicio)}
                    </p>
                    <p className="text-xs font-body text-navy/40">{clase.duracion_minutos}′</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-sm font-body font-semibold truncate ${clase.cancelada ? 'text-navy/40 line-through' : 'text-navy'}`}>
                        {clase.nombre}
                      </p>
                      {clase.es_especial && (
                        <span className="flex-shrink-0 text-xs font-body text-white bg-orange/80 rounded-full px-1.5 py-0.5 leading-none">
                          especial
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-body text-navy/50 truncate">{clase.instructor}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {clase.cancelada ? (
                      <span className="text-xs font-body font-semibold px-2 py-1 rounded-full bg-red-100 text-red-500">
                        Cancelada
                      </span>
                    ) : (
                      <span className={`text-xs font-body font-semibold px-2 py-1 rounded-full ${
                        clase.confirmadas >= clase.cupo_maximo
                          ? 'bg-navy/10 text-navy/60'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {clase.confirmadas}/{clase.cupo_maximo}
                      </span>
                    )}
                  </div>
                  <svg className="w-4 h-4 text-navy/20 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
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
