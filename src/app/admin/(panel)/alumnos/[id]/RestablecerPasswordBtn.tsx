'use client'
import { useState } from 'react'
import { resetearPasswordAlumno } from './actions'

type Step = 'idle' | 'confirm' | 'loading' | 'done' | 'error'

export default function RestablecerPasswordBtn({
  alumnoId,
  alumnoNombre,
}: {
  alumnoId: string
  alumnoNombre: string
}) {
  const [step, setStep] = useState<Step>('idle')
  const [tempPassword, setTempPassword] = useState('')
  const [copied, setCopied] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleGenerar() {
    setStep('loading')
    const result = await resetearPasswordAlumno(alumnoId)
    if ('error' in result) {
      setErrorMsg(result.error)
      setStep('error')
    } else {
      setTempPassword(result.password)
      setStep('done')
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(tempPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (step === 'idle') {
    return (
      <button
        onClick={() => setStep('confirm')}
        className="text-sm font-body text-orange/70 hover:text-orange transition-colors"
      >
        Restablecer contraseña
      </button>
    )
  }

  if (step === 'confirm') {
    return (
      <div className="mt-3 bg-orange/5 border border-orange/20 rounded-xl p-4 space-y-3">
        <p className="text-sm font-body text-navy">
          ¿Querés generar una nueva contraseña temporal para{' '}
          <span className="font-semibold">{alumnoNombre}</span>?
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setStep('idle')}
            className="flex-1 py-2 text-sm font-body text-navy/50 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleGenerar}
            className="flex-1 py-2 text-sm font-semibold font-body text-white bg-orange rounded-lg hover:bg-orange/90 transition-colors"
          >
            Generar
          </button>
        </div>
      </div>
    )
  }

  if (step === 'loading') {
    return (
      <div className="mt-3 bg-orange/5 border border-orange/20 rounded-xl p-4">
        <p className="text-sm font-body text-navy/50 text-center">Generando contraseña…</p>
      </div>
    )
  }

  if (step === 'error') {
    return (
      <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
        <p className="text-sm font-body text-red-600">{errorMsg}</p>
        <button
          onClick={() => setStep('idle')}
          className="text-xs font-body text-navy/50 hover:text-navy"
        >
          Cerrar
        </button>
      </div>
    )
  }

  // done
  return (
    <div className="mt-3 bg-orange/5 border border-orange/20 rounded-xl p-4 space-y-3">
      <p className="text-xs font-semibold font-body text-navy/50 uppercase tracking-widest">
        Contraseña temporal
      </p>
      <div className="flex items-center gap-2">
        <code className="flex-1 bg-white border border-orange/30 rounded-lg px-3 py-2 text-lg font-mono font-bold text-navy tracking-widest">
          {tempPassword}
        </code>
        <button
          onClick={handleCopy}
          className="shrink-0 px-3 py-2 text-xs font-semibold font-body text-white bg-orange rounded-lg hover:bg-orange/90 transition-colors"
        >
          {copied ? '¡Copiado!' : 'Copiar'}
        </button>
      </div>
      <p className="text-xs font-body text-navy/50">
        Copiá esta contraseña y compartila con el alumno. Solo se mostrará una vez.
      </p>
      <button
        onClick={() => setStep('idle')}
        className="text-xs font-body text-navy/40 hover:text-navy/60 transition-colors"
      >
        Cerrar
      </button>
    </div>
  )
}
