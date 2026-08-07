'use client'

import { useState } from 'react'
import ReservarBtn from './ReservarBtn'
import type { SemanaGroup, ClaseInfo } from './clases-types'

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 text-navy/40 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none" stroke="currentColor" viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function ClaseRow({ oc }: { oc: ClaseInfo }) {
  const hora = oc.hora_inicio.slice(0, 5)
  const sinCupo = !oc.yaReservada && !oc.cancelada && oc.cupo_maximo > 0 && oc.confirmadas >= oc.cupo_maximo

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-t border-gray-100 first:border-0">
      <div className="shrink-0 w-12 text-center">
        <p className="text-sm font-heading font-extrabold text-navy tabular-nums">{hora}</p>
        <p className="text-xs font-body text-navy/40">{oc.duracion_minutos}′</p>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-body font-semibold text-sm text-navy">{oc.nombre}</p>
          {oc.es_especial && (
            <span className="text-xs font-body font-semibold text-orange bg-orange/10 px-1.5 py-0.5 rounded-full">
              Especial
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {oc.instructor && (
            <span className="text-xs font-body text-navy/50">{oc.instructor}</span>
          )}
          {!oc.cancelada && oc.cupo_maximo > 0 && (
            <span className="text-xs font-body text-navy/30">
              {oc.confirmadas}/{oc.cupo_maximo} lugares
            </span>
          )}
          {oc.yaReservada && !oc.cancelada && (
            <span className="text-xs font-body font-semibold text-green-600">✓ Reservado</span>
          )}
          {sinCupo && (
            <span className="text-xs font-body text-red-400">Sin cupo</span>
          )}
        </div>
        {oc.descripcion && (
          <p className="text-xs font-body text-navy/40 mt-0.5 line-clamp-2">{oc.descripcion}</p>
        )}
      </div>
      <div className="shrink-0">
        <ReservarBtn
          serieId={oc.serie_id}
          excepcionId={oc.excepcion_id}
          fechaOcurrencia={oc.fecha}
          cupoMaximo={oc.cupo_maximo}
          confirmadas={oc.confirmadas}
          yaReservada={oc.yaReservada}
          cancelada={oc.cancelada}
        />
      </div>
    </div>
  )
}

export default function ClasesView({ semanas }: { semanas: SemanaGroup[] }) {
  const [openWeek, setOpenWeek] = useState<string | null>(null)
  const [openDay, setOpenDay] = useState<string | null>(null)

  const currentSemana = semanas.find(s => s.esActual)
  const futureSemanas = semanas.filter(s => !s.esActual)

  const totalClases = semanas.reduce(
    (a, s) => a + s.dias.reduce((b, d) => b + d.clases.length, 0),
    0,
  )

  if (totalClases === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm px-6 py-8 text-center">
        <p className="text-navy/40 font-body text-sm">No hay clases programadas por el momento.</p>
      </div>
    )
  }

  function toggleWeek(monday: string) {
    if (openWeek === monday) {
      setOpenWeek(null)
      setOpenDay(null)
    } else {
      setOpenWeek(monday)
      setOpenDay(null)
    }
  }

  function toggleDay(fecha: string) {
    setOpenDay(prev => (prev === fecha ? null : fecha))
  }

  return (
    <div className="space-y-4">

      {/* ── Semana actual (siempre expandida) ── */}
      {currentSemana && (
        <div>
          <p className="text-xs font-body font-semibold tracking-widest text-navy/50 uppercase mb-2">
            Semana actual · {currentSemana.label}
          </p>
          {currentSemana.dias.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm px-5 py-5 text-center">
              <p className="text-navy/40 font-body text-sm">Sin clases para el resto de esta semana.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {currentSemana.dias.map((dia, i) => (
                <div key={dia.fecha} className={i > 0 ? 'border-t border-gray-100' : ''}>
                  <div className="px-4 py-2.5 bg-navy/[0.03]">
                    <p className="font-body font-semibold text-xs text-navy/60 uppercase tracking-wide">
                      {dia.label}
                    </p>
                  </div>
                  {dia.clases.map(oc => (
                    <ClaseRow key={oc.excepcion_id ?? `${oc.serie_id}|${oc.fecha}`} oc={oc} />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Semanas futuras (acordeón) ── */}
      {futureSemanas.length > 0 && (
        <div className="space-y-2">
          {futureSemanas.map(semana => {
            const isWeekOpen = openWeek === semana.monday
            const totalSemana = semana.dias.reduce((a, d) => a + d.clases.length, 0)

            return (
              <div key={semana.monday} className="bg-white rounded-2xl shadow-sm overflow-hidden">

                {/* Cabecera de semana */}
                <button
                  onClick={() => toggleWeek(semana.monday)}
                  className="w-full flex items-center justify-between px-4 py-4 text-left"
                >
                  <div>
                    <p className="font-body font-semibold text-sm text-navy">
                      Semana del {semana.label}
                    </p>
                    <p className="text-xs font-body text-navy/40 mt-0.5">
                      {totalSemana} clase{totalSemana !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <ChevronIcon open={isWeekOpen} />
                </button>

                {/* Días de la semana */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isWeekOpen ? 'max-h-[5000px]' : 'max-h-0'
                  }`}
                >
                  <div className="border-t border-gray-100">
                    {semana.dias.map((dia, i) => {
                      const isDayOpen = openDay === dia.fecha

                      return (
                        <div
                          key={dia.fecha}
                          className={i > 0 ? 'border-t border-gray-100' : ''}
                        >
                          {/* Cabecera de día */}
                          <button
                            onClick={() => toggleDay(dia.fecha)}
                            className="w-full flex items-center justify-between px-5 py-3.5 text-left"
                          >
                            <p className="font-body font-semibold text-sm text-navy">{dia.label}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-body text-navy/40">
                                {dia.clases.length} clase{dia.clases.length !== 1 ? 's' : ''}
                              </span>
                              <ChevronIcon open={isDayOpen} />
                            </div>
                          </button>

                          {/* Clases del día */}
                          <div
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${
                              isDayOpen ? 'max-h-[2000px]' : 'max-h-0'
                            }`}
                          >
                            <div className="bg-gray-50/60 border-t border-gray-100">
                              {dia.clases.map(oc => (
                                <ClaseRow
                                  key={oc.excepcion_id ?? `${oc.serie_id}|${oc.fecha}`}
                                  oc={oc}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
