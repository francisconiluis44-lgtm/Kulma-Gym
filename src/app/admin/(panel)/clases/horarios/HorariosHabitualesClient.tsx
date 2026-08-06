'use client'

import { useState } from 'react'
import { formatHora } from '../dateUtils'
import NuevaSerieForm from './NuevaSerieForm'

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

export default function HorariosHabitualesClient({ porDia, diasSemana }: Props) {
  const [formDia, setFormDia] = useState<number | null>(null)

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
                onClick={() => setFormDia(showForm ? null : dow)}
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

            {clases.map((v, i) => (
              <div
                key={v.id}
                className={`flex items-center gap-4 px-5 py-3 ${i > 0 ? 'border-t border-gray-50' : ''}`}
              >
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
                <div className="flex-shrink-0 text-right">
                  <span className="text-xs font-body text-navy/40 tabular-nums">
                    {v.cupo_maximo} cupos
                  </span>
                </div>
              </div>
            ))}

            {showForm && (
              <div className="border-t border-orange/20 bg-orange/5 px-5 py-4">
                <NuevaSerieForm
                  diaSemana={dow}
                  diaNombre={dia}
                  onSuccess={() => setFormDia(null)}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
