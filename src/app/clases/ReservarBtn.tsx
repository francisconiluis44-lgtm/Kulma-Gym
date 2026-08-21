'use client'

import { useState, useTransition } from 'react'
import { reservarClase, cancelarReserva } from './actions'

interface Props {
  serieId: string | null
  excepcionId: string | null
  fechaOcurrencia: string
  cupoMaximo: number
  confirmadas: number
  yaReservada: boolean
  cancelada: boolean
  quotaAgotada?: boolean
}

export default function ReservarBtn({
  serieId, excepcionId, fechaOcurrencia, cupoMaximo, confirmadas, yaReservada, cancelada, quotaAgotada,
}: Props) {
  const [reservada, setReservada] = useState(yaReservada)
  const [ocupadas, setOcupadas] = useState(confirmadas)
  const [msg, setMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const hoyAR = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
  const esMismaFecha = fechaOcurrencia === hoyAR

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
            Reservado
          </span>
          {!esMismaFecha && (
            <button
              onClick={handleCancelar}
              disabled={isPending}
              className="flex items-center gap-1 text-xs font-body font-semibold text-red-500 border border-red-200 hover:bg-red-50 active:scale-[0.93] active:bg-red-100 transition-all px-3 py-1.5 rounded-full disabled:opacity-40 touch-manipulation"
            >
              {isPending ? (
                'Saliendo…'
              ) : (
                <>
                  <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 16 16">
                    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                  Salir
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
        <p className={`text-xs font-body ${msg.type === 'ok' ? 'text-green-600' : 'text-red-500'}`}>
          {msg.text}
        </p>
      )}
    </div>
  )
}
