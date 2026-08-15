'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { getAsistenciasMes, getAsistenciasDia, type AsistenciaDia } from './actions'

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

interface Props {
  mes: string
  diasConAsistencia: Record<string, number>
}

export default function CalendarioAsistencias({ mes: mesInicial, diasConAsistencia: diasInicial }: Props) {
  const [mes, setMes] = useState(mesInicial)
  const [diasConAsistencia, setDiasConAsistencia] = useState(diasInicial)
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null)
  const [detalle, setDetalle] = useState<AsistenciaDia | null>(null)
  const [isPendingMes, startMesTransition] = useTransition()
  const [isPendingDia, startDiaTransition] = useTransition()
  const mesRef = useRef(mes)

  // Refrescar al recuperar el foco (ej: usuario volvió del import)
  useEffect(() => {
    mesRef.current = mes
  }, [mes])

  useEffect(() => {
    function handleVisibilityChange() {
      if (!document.hidden) {
        const mesCurrent = mesRef.current
        startMesTransition(async () => {
          const datos = await getAsistenciasMes(mesCurrent)
          setDiasConAsistencia(datos)
        })
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const [mesYearStr, mesMonthStr] = mes.split('-')
  const mesYear = parseInt(mesYearStr)
  const mesMonth = parseInt(mesMonthStr)

  const prevDate = new Date(Date.UTC(mesYear, mesMonth - 2, 1))
  const nextDate = new Date(Date.UTC(mesYear, mesMonth, 1))
  const prevMes = `${prevDate.getUTCFullYear()}-${String(prevDate.getUTCMonth() + 1).padStart(2, '0')}`
  const nextMes = `${nextDate.getUTCFullYear()}-${String(nextDate.getUTCMonth() + 1).padStart(2, '0')}`

  const totalDias = new Date(Date.UTC(mesYear, mesMonth, 0)).getUTCDate()
  const primerDow = new Date(Date.UTC(mesYear, mesMonth - 1, 1)).getUTCDay()
  const offset = primerDow === 0 ? 6 : primerDow - 1

  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: totalDias }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  function navMes(nuevoMes: string) {
    startMesTransition(async () => {
      const datos = await getAsistenciasMes(nuevoMes)
      setMes(nuevoMes)
      setDiasConAsistencia(datos)
      setFechaSeleccionada(null)
      setDetalle(null)
    })
  }

  function seleccionarDia(fecha: string) {
    if (fechaSeleccionada === fecha) {
      setFechaSeleccionada(null)
      setDetalle(null)
      return
    }
    setFechaSeleccionada(fecha)
    setDetalle(null)
    startDiaTransition(async () => {
      const datos = await getAsistenciasDia(fecha)
      setDetalle(datos)
      // Auto-corregir el contador del calendario si difiere del real
      const realCount = datos.registrados.length + datos.importados.length
      setDiasConAsistencia(prev =>
        (prev[fecha] ?? 0) !== realCount ? { ...prev, [fecha]: realCount } : prev
      )
    })
  }

  const total = detalle ? detalle.registrados.length + detalle.importados.length : 0

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl shadow-sm px-5 py-5">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navMes(prevMes)}
            disabled={isPendingMes}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-navy/5 transition-colors text-navy/40 hover:text-navy font-body text-lg disabled:opacity-40"
            aria-label="Mes anterior"
          >
            ‹
          </button>
          <h3 className={`font-heading font-bold text-navy text-base transition-opacity ${isPendingMes ? 'opacity-40' : ''}`}>
            {MESES_ES[mesMonth - 1]} {mesYear}
          </h3>
          <button
            onClick={() => navMes(nextMes)}
            disabled={isPendingMes}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-navy/5 transition-colors text-navy/40 hover:text-navy font-body text-lg disabled:opacity-40"
            aria-label="Mes siguiente"
          >
            ›
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DIAS_SEMANA.map(d => (
            <div key={d} className="text-center text-[10px] font-body text-navy/40 font-semibold py-1 tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className={`grid grid-cols-7 gap-1 transition-opacity ${isPendingMes ? 'opacity-30' : ''}`}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} className="aspect-square" />

            const fecha = `${mes}-${String(day).padStart(2, '0')}`
            const count = diasConAsistencia[fecha] ?? 0
            const isSelected = fecha === fechaSeleccionada

            if (count === 0) {
              return (
                <div key={i} className="aspect-square flex items-center justify-center">
                  <span className="text-xs font-body text-navy/25">{day}</span>
                </div>
              )
            }

            return (
              <button
                key={i}
                onClick={() => seleccionarDia(fecha)}
                className={`aspect-square flex flex-col items-center justify-center rounded-xl transition-all gap-0.5 active:scale-95
                  ${isSelected ? 'bg-orange text-white shadow-sm' : 'bg-navy/5 hover:bg-orange/15 text-navy'}`}
              >
                <span className="text-xs font-body font-semibold leading-none">{day}</span>
                <span className={`text-[9px] font-body leading-none ${isSelected ? 'text-white/70' : 'text-navy/40'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        <p className="text-[10px] font-body text-navy/30 text-center mt-3">
          El número indica cuántos alumnos asistieron ese día
        </p>
      </div>

      {/* Day detail — rendered inline, no URL change */}
      {fechaSeleccionada && (
        <div className="bg-white rounded-2xl shadow-sm px-6 py-6">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <p className="text-xs font-body font-semibold tracking-widest text-orange uppercase">
              {new Date(fechaSeleccionada + 'T12:00:00Z').toLocaleDateString('es-AR', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
            <a
              href={`/api/admin/asistencias/export?fecha=${fechaSeleccionada}`}
              download
              className="flex items-center gap-1.5 text-xs font-body font-semibold text-navy/50 hover:text-navy transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Descargar CSV
            </a>
          </div>

          {isPendingDia ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-9 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : detalle && total > 0 ? (
            <>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="text-xs font-body font-semibold text-navy/60">Total: {total}</span>
                {detalle.importados.length > 0 && (
                  <>
                    <span className="text-navy/20">·</span>
                    <span className="text-xs font-body text-navy/40">{detalle.registrados.length} registrados</span>
                    <span className="text-navy/20">·</span>
                    <span className="text-xs font-body text-navy/40">{detalle.importados.length} importados</span>
                  </>
                )}
              </div>
              <ul className="space-y-2">
                {detalle.registrados.map(a => (
                  <li key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="font-body text-sm text-navy">{a.nombre}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-navy/40 font-body tabular-nums">{a.hora} hs</span>
                      {a.tipo === 'admin' && (
                        <span className="text-xs font-body bg-navy/10 text-navy/60 px-2 py-0.5 rounded-full">manual</span>
                      )}
                    </div>
                  </li>
                ))}
                {detalle.importados.map(a => (
                  <li key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="font-body text-sm text-navy">{a.nombre}</span>
                    <span className="text-xs font-body bg-navy/10 text-navy/60 px-2 py-0.5 rounded-full">importado</span>
                  </li>
                ))}
              </ul>
            </>
          ) : detalle ? (
            <p className="text-navy/40 font-body text-sm">Sin asistencias registradas ese día.</p>
          ) : null}
        </div>
      )}
    </div>
  )
}
