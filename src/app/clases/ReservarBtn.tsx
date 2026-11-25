'use client'

import { useState, useTransition } from 'react'
import { reservarClase, cancelarReserva, marcarTurnoFijo } from './actions'

interface Props {
  serieId: string | null
  excepcionId: string | null
  fechaOcurrencia: string
  horaInicio: string
  cupoMaximo: number
  confirmadas: number
  yaReservada: boolean
  cancelada: boolean
  quotaAgotada?: boolean
  cancelacionMismoDia?: boolean
  gymSlug?: string
}

export default function ReservarBtn({
  serieId, excepcionId, fechaOcurrencia, horaInicio, cupoMaximo, confirmadas, yaReservada, cancelada, quotaAgotada, cancelacionMismoDia, gymSlug,
}: Props) {
  const [reservada, setReservada] = useState(yaReservada)
  const [ocupadas, setOcupadas] = useState(confirmadas)
  const [msg, setMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [showTurnoFijo, setShowTurnoFijo] = useState(false)
  const [turnoFijoHecho, setTurnoFijoHecho] = useState(false)

  const hoyAR = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
  const esMismaFecha = fechaOcurrencia === hoyAR

  const diaNombre = new Date(fechaOcurrencia + 'T12:00:00Z')
    .toLocaleDateString('es-AR', { weekday: 'long', timeZone: 'UTC' })
  const hora = horaInicio.slice(0, 5)

  if (cancelada) {
    return <span className="text-xs font-body font-semibold bg-red-100 text-red-400 px-3 py-1.5 rounded-full">Cancelada</span>
  }

  const sinCupo = !reservada && cupoMaximo > 0 && ocupadas >= cupoMaximo

  function handleReservar() {
    setMsg(null)
    startTransition(async () => {
      const result = await reservarClase({ serieId, excepcionId, fechaOcurrencia, cupoMaximo })
      if ('ok' in result) {
        setReservada(true)
        setOcupadas(prev => prev + 1)
        setMsg(null)
        if (gymSlug === 'fullbody' && serieId !== null) {
          setShowTurnoFijo(true)
        }
      } else {
        setMsg({ type: 'error', text: result.error })
      }
    })
  }

  function handleCancelar() {
    setMsg(null)
    startTransition(async () => {
      const result = await cancelarReserva({ serieId, excepcionId, fechaOcurrencia })
      if ('ok' in result) {
        setReservada(false)
        setOcupadas(prev => Math.max(0, prev - 1))
        setMsg(null)
        setTurnoFijoHecho(false)
      } else {
        setMsg({ type: 'error', text: result.error })
      }
    })
  }

  function handleMarcarFijo() {
    if (!serieId) return
    startTransition(async () => {
      const result = await marcarTurnoFijo({ serieId, fechaOcurrencia })
      setShowTurnoFijo(false)
      if ('ok' in result) {
        setTurnoFijoHecho(true)
      } else {
        setMsg({ type: 'error', text: result.error })
      }
    })
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      {reservada ? (
        <div className="flex flex-col items-end gap-1.5">
          <span className="flex items-center gap-1.5 text-xs font-body font-semibold bg-green-100 text-green-700 px-3 py-1.5 rounded-full">
            <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            {turnoFijoHecho ? 'Reservado · fijo' : 'Reservado'}
          </span>
          {(!esMismaFecha || cancelacionMismoDia) && (
            <button
              onClick={handleCancelar}
              disabled={isPending}
              className="flex items-center gap-1 text-xs font-body font-semibold text-red-500 border border-red-200 hover:bg-red-50 active:scale-[0.93] active:bg-red-100 transition-all px-3 py-1.5 rounded-full disabled:opacity-40 touch-manipulation"
            >
              {isPending ? (
                'Cancelando…'
              ) : (
                <>
                  <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 16 16">
                    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                  Cancelar turno
                </>
              )}
            </button>
          )}
        </div>
      ) : sinCupo ? (
        <span className="text-xs font-body font-semibold bg-navy/10 text-navy/40 px-3 py-1.5 rounded-full">
          Sin cupo
        </span>
      ) : quotaAgotada ? (
        <span className="text-xs font-body font-semibold bg-red-50 text-red-400 px-3 py-1.5 rounded-full">
          Cuota agotada
        </span>
      ) : (
        <button
          onClick={handleReservar}
          disabled={isPending}
          className="text-xs font-body font-semibold bg-orange text-white hover:bg-orange/90 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
        >
          {isPending ? '...' : 'Reservar'}
        </button>
      )}
      {msg && (
        <div className={`flex items-start gap-1.5 text-xs font-body px-3 py-2 rounded-xl leading-snug max-w-[220px] ${
          msg.type === 'ok'
            ? 'bg-green-50 border border-green-100 text-green-700'
            : 'bg-orange/10 border border-orange/25 text-orange'
        }`}>
          {msg.type === 'error' ? (
            <svg className="w-3.5 h-3.5 shrink-0 mt-px" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 shrink-0 mt-px" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Bottom sheet de turno fijo — solo Fullbody */}
      {showTurnoFijo && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(10,15,30,0.45)' }}
          onClick={() => setShowTurnoFijo(false)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-t-3xl px-6 pt-4 pb-10 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-9 h-1 rounded-full bg-navy/15 mx-auto mb-5" />

            {/* Icono */}
            <div className="w-12 h-12 rounded-2xl bg-orange/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>

            <p className="font-heading font-extrabold text-navy text-xl mb-2">¿Turno fijo?</p>
            <p className="font-body text-sm text-navy/55 mb-7 leading-relaxed">
              ¿Querés reservar todos los{' '}
              <span className="font-semibold text-navy capitalize">{diaNombre}</span>
              {' '}a las{' '}
              <span className="font-semibold text-navy">{hora}hs</span>
              {' '}automáticamente cada semana?
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleMarcarFijo}
                disabled={isPending}
                className="w-full text-sm font-body font-semibold bg-orange text-white py-3.5 rounded-2xl transition-all hover:bg-orange/90 active:scale-[0.97] disabled:opacity-50"
              >
                {isPending ? 'Guardando…' : 'Sí, turno fijo'}
              </button>
              <button
                onClick={() => setShowTurnoFijo(false)}
                disabled={isPending}
                className="w-full text-sm font-body font-semibold text-navy/50 py-3 rounded-2xl border border-navy/[0.12] hover:bg-navy/5 active:scale-[0.97] transition-all"
              >
                Solo por hoy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
