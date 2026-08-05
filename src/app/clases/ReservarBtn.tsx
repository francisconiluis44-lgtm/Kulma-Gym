'use client'

import { useState, useTransition } from 'react'
import { reservarClase, cancelarReserva } from './actions'

interface Props {
  claseId: string
  reservada: boolean
  sinCupo: boolean
  cancelada: boolean
}

export default function ReservarBtn({ claseId, reservada, sinCupo, cancelada }: Props) {
  const [estado, setEstado] = useState<'reservada' | 'libre'>(reservada ? 'reservada' : 'libre')
  const [msg, setMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  if (cancelada) {
    return <span className="text-xs font-body font-semibold bg-red-100 text-red-400 px-3 py-1.5 rounded-full">Cancelada</span>
  }

  function handleReservar() {
    setMsg(null)
    startTransition(async () => {
      const result = await reservarClase(claseId)
      if ('ok' in result) {
        setEstado('reservada')
        setMsg({ type: 'ok', text: 'Reserva confirmada.' })
      } else {
        setMsg({ type: 'error', text: result.error })
      }
    })
  }

  function handleCancelar() {
    setMsg(null)
    startTransition(async () => {
      const result = await cancelarReserva(claseId)
      if ('ok' in result) {
        setEstado('libre')
        setMsg({ type: 'ok', text: 'Reserva cancelada.' })
      } else {
        setMsg({ type: 'error', text: result.error })
      }
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {estado === 'reservada' ? (
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
