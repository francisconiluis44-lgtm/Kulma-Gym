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
}

export default function ReservarBtn({
  serieId, excepcionId, fechaOcurrencia, cupoMaximo, confirmadas, yaReservada, cancelada,
}: Props) {
  const [reservada, setReservada] = useState(yaReservada)
  const [ocupadas, setOcupadas] = useState(confirmadas)
  const [msg, setMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

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
        setMsg({ type: 'ok', text: 'Reserva confirmada.' })
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
        setMsg({ type: 'ok', text: 'Reserva cancelada.' })
      } else {
        setMsg({ type: 'error', text: result.error })
      }
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {reservada ? (
        <button
          onClick={handleCancelar}
          disabled={isPending}
          className="text-xs font-body font-semibold bg-navy/10 text-navy/60 hover:bg-red-100 hover:text-red-500 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
        >
          {isPending ? '...' : 'Cancelar reserva'}
        </button>
      ) : sinCupo ? (
        <span className="text-xs font-body font-semibold bg-navy/10 text-navy/40 px-3 py-1.5 rounded-full">
          Sin cupo
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
