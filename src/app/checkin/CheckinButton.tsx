'use client'

import { useState, useTransition } from 'react'
import { registrarCheckin } from './actions'

type State =
  | { type: 'idle' }
  | { type: 'ok'; hora: string }
  | { type: 'ya_registrada'; hora?: string }
  | { type: 'error'; msg: string }

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function CheckinButton({
  yaRegistrado,
  hora,
}: {
  yaRegistrado: boolean
  hora: string | null
}) {
  const [state, setState] = useState<State>(
    yaRegistrado
      ? { type: 'ya_registrada', hora: hora ?? undefined }
      : { type: 'idle' }
  )
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const result = await registrarCheckin()
      if ('ok' in result) {
        setState({ type: 'ok', hora: result.hora })
      } else if (result.error === 'ya_registrada') {
        setState({ type: 'ya_registrada', hora: result.hora })
      } else {
        setState({ type: 'error', msg: result.error })
      }
    })
  }

  if (state.type === 'ok') {
    return (
      <div className="space-y-3">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-xl font-heading font-bold text-navy">¡Asistencia registrada!</p>
        {state.hora && (
          <p className="text-navy/50 font-body text-sm tabular-nums">{formatHora(state.hora)} hs</p>
        )}
        <p className="text-sm text-navy/40 font-body">¡Que buen entrenamiento! 💪</p>
      </div>
    )
  }

  if (state.type === 'ya_registrada') {
    return (
      <div className="space-y-3">
        <div className="w-16 h-16 rounded-full bg-orange/10 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-xl font-heading font-bold text-navy">Ya registraste tu asistencia hoy</p>
        {state.hora && (
          <p className="text-navy/50 font-body text-sm tabular-nums">{formatHora(state.hora)} hs</p>
        )}
        <p className="text-sm text-navy/40 font-body">¡Seguí entrenando! 🔥</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-navy/50 font-body text-sm">
        Tocá el botón para registrar tu visita de hoy.
      </p>
      <button
        onClick={handleClick}
        disabled={isPending}
        className="w-full py-4 rounded-2xl bg-orange text-white font-heading font-extrabold text-lg transition-all
                   active:scale-95 disabled:opacity-60"
      >
        {isPending ? 'Registrando...' : 'Registrar asistencia'}
      </button>
      {state.type === 'error' && (
        <p className="text-sm text-red-500 font-body">{state.msg}</p>
      )}
    </div>
  )
}
