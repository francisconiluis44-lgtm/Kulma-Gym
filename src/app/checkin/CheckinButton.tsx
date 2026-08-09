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
      <div className="space-y-3 animate-fade-in">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.30)' }}
        >
          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-xl font-heading font-bold text-white">¡Asistencia registrada!</p>
        {state.hora && (
          <p className="text-white/40 font-body text-sm tabular-nums">{formatHora(state.hora)} hs</p>
        )}
        <p className="text-sm text-white/35 font-body">¡Que buen entrenamiento!</p>
      </div>
    )
  }

  if (state.type === 'ya_registrada') {
    return (
      <div className="space-y-3 animate-fade-in">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: 'color-mix(in srgb, var(--color-orange) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--color-orange) 30%, transparent)' }}
        >
          <svg className="w-8 h-8 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-xl font-heading font-bold text-white">Ya registraste tu asistencia hoy</p>
        {state.hora && (
          <p className="text-white/40 font-body text-sm tabular-nums">{formatHora(state.hora)} hs</p>
        )}
        <p className="text-sm text-white/35 font-body">¡Seguí entrenando!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-white/40 font-body text-sm">
        Tocá el botón para registrar tu visita de hoy.
      </p>
      <button
        onClick={handleClick}
        disabled={isPending}
        className="btn-shine w-full py-5 rounded-2xl bg-orange text-white font-heading font-extrabold text-lg transition-all active:scale-95 disabled:opacity-60"
        style={{ boxShadow: '0 0 36px color-mix(in srgb, var(--color-orange) 40%, transparent)' }}
      >
        {isPending ? 'Registrando...' : 'Registrar asistencia'}
      </button>
      {state.type === 'error' && (
        <p className="text-sm text-red-400 font-body">{state.msg}</p>
      )}
    </div>
  )
}
