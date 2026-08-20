'use client'

import { useState, useTransition } from 'react'
import { registrarPagoIA, actualizarLimiteIA } from './actions'

interface Props {
  gimnasioId: string
  aiTrialStart: string | null
  aiPaidUntil: string | null
  aiDailyLimit: number | null
  todayAR: string
}

function getStatus(aiTrialStart: string | null, aiPaidUntil: string | null, todayAR: string) {
  if (aiPaidUntil && todayAR <= aiPaidUntil) {
    const [, mm, dd] = aiPaidUntil.split('-')
    return { tipo: 'paid' as const, label: `Activo hasta ${dd}/${mm}` }
  }
  if (aiTrialStart) {
    const startDate = new Date(
      new Date(aiTrialStart).toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }) + 'T00:00:00',
    )
    startDate.setDate(startDate.getDate() + 2)
    const trialEnd = startDate.toISOString().slice(0, 10)
    if (todayAR <= trialEnd) {
      const todayDate = new Date(todayAR + 'T00:00:00')
      const endDate = new Date(trialEnd + 'T00:00:00')
      const dias = Math.round((endDate.getTime() - todayDate.getTime()) / 86400000) + 1
      return { tipo: 'trial' as const, label: `Trial · ${dias} ${dias === 1 ? 'día' : 'días'}` }
    }
    return { tipo: 'free' as const, label: 'Gratuito (3/día)' }
  }
  return { tipo: 'none' as const, label: 'Sin usar' }
}

export default function AIStatusForm({ gimnasioId, aiTrialStart, aiPaidUntil, aiDailyLimit, todayAR }: Props) {
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const [localPaidUntil, setLocalPaidUntil] = useState(aiPaidUntil)
  const [limiteInput, setLimiteInput] = useState(String(aiDailyLimit ?? ''))
  const [limiteMsg, setLimiteMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const [isPendingLimite, startLimiteTransition] = useTransition()

  const status = getStatus(aiTrialStart, localPaidUntil, todayAR)

  const colorMap = {
    paid: 'bg-green-900/20 text-green-400',
    trial: 'bg-blue-900/20 text-blue-400',
    free: 'bg-orange/20 text-orange',
    none: 'bg-gray-700 text-gray-400',
  }

  function handleLimite() {
    setLimiteMsg(null)
    const val = limiteInput.trim() === '' ? null : parseInt(limiteInput)
    if (val !== null && (isNaN(val) || val < 1)) {
      setLimiteMsg({ type: 'error', text: 'Número inválido' })
      return
    }
    startLimiteTransition(async () => {
      const result = await actualizarLimiteIA(gimnasioId, val)
      if ('ok' in result) {
        setLimiteMsg({ type: 'ok', text: val ? `Límite: ${val}/día` : 'Vuelve al default (25/día)' })
      } else {
        setLimiteMsg({ type: 'error', text: result.error })
      }
    })
  }

  function handlePago() {
    setMsg(null)
    startTransition(async () => {
      const result = await registrarPagoIA(gimnasioId)
      if ('ok' in result) {
        // Compute new paid_until locally
        const until = new Date(todayAR + 'T00:00:00')
        until.setDate(until.getDate() + 30)
        setLocalPaidUntil(until.toISOString().slice(0, 10))
        setMsg({ type: 'ok', text: 'Pago registrado · +30 días' })
      } else {
        setMsg({ type: 'error', text: result.error })
      }
    })
  }

  return (
    <div className="space-y-3">
    <div className="flex items-center gap-3 flex-wrap">
      <span className={`text-xs font-semibold font-body px-2.5 py-1 rounded-full ${colorMap[status.tipo]}`}>
        {status.label}
      </span>
      {msg?.type === 'ok' ? (
        <p className="text-xs font-body text-green-400">{msg.text}</p>
      ) : (
        <button
          onClick={handlePago}
          disabled={isPending}
          className="text-xs font-body text-white/50 hover:text-white transition-colors disabled:opacity-40"
        >
          {isPending ? '…' : 'Registrar pago (+30 días)'}
        </button>
      )}
      {msg?.type === 'error' && (
        <p className="text-xs font-body text-red-400">{msg.text}</p>
      )}
    </div>
    <div className="flex items-center gap-2 flex-wrap">
      <input
        type="number"
        min={1}
        value={limiteInput}
        onChange={e => setLimiteInput(e.target.value)}
        placeholder="Límite custom (vacío = 25)"
        className="text-xs font-body bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-1.5 w-44 placeholder:text-white/30"
      />
      <button
        onClick={handleLimite}
        disabled={isPendingLimite}
        className="text-xs font-body text-white/50 hover:text-white transition-colors disabled:opacity-40"
      >
        {isPendingLimite ? '…' : 'Guardar límite'}
      </button>
      {limiteMsg && (
        <p className={`text-xs font-body ${limiteMsg.type === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
          {limiteMsg.text}
        </p>
      )}
    </div>
    </div>
  )
}
