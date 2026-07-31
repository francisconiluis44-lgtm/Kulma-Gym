'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { vincularAlumnoExterno, desvincularAlumnoExterno } from './actions'

type Alumno = { id: string; nombre: string }
type View = 'idle' | 'buscando' | 'confirmando'

export default function VincularAlumnoForm({
  externoId,
  nombreExterno,
  alumnoVinculado,
  alumnos,
}: {
  externoId: string
  nombreExterno: string
  alumnoVinculado: Alumno | null
  alumnos: Alumno[]
}) {
  const [view, setView] = useState<View>('idle')
  const [busqueda, setBusqueda] = useState('')
  const [seleccionado, setSeleccionado] = useState<Alumno | null>(null)
  const [msg, setMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const filtrados = useMemo(() => {
    if (!busqueda.trim()) return alumnos.slice(0, 8)
    const q = busqueda.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    return alumnos
      .filter(a => a.nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(q))
      .slice(0, 8)
  }, [busqueda, alumnos])

  function reset() {
    setView('idle')
    setBusqueda('')
    setSeleccionado(null)
    setMsg(null)
  }

  function handleVincular() {
    if (!seleccionado) return
    startTransition(async () => {
      const result = await vincularAlumnoExterno(externoId, seleccionado.id)
      if ('ok' in result) {
        setMsg({ type: 'ok', text: `Vinculada con ${seleccionado.nombre}.` })
        setView('idle')
        router.refresh()
      } else {
        setMsg({ type: 'error', text: result.error })
      }
    })
  }

  function handleDesvincular() {
    startTransition(async () => {
      const result = await desvincularAlumnoExterno(externoId)
      if ('ok' in result) {
        setMsg({ type: 'ok', text: 'Desvinculada.' })
        router.refresh()
      } else {
        setMsg({ type: 'error', text: result.error })
      }
    })
  }

  if (alumnoVinculado) {
    return (
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-body text-navy/50">Vinculada con</span>
          <span className="text-xs font-semibold font-body text-navy bg-green-50 px-2 py-0.5 rounded-full">
            {alumnoVinculado.nombre}
          </span>
          <button
            onClick={handleDesvincular}
            disabled={isPending}
            className="text-xs font-body text-navy/30 hover:text-red-500 transition-colors disabled:opacity-50"
          >
            {isPending ? 'Desvinculando...' : 'Desvincular'}
          </button>
        </div>
        {msg && (
          <p className={`mt-1 text-xs font-body ${msg.type === 'ok' ? 'text-green-600' : 'text-red-500'}`}>
            {msg.text}
          </p>
        )}
      </div>
    )
  }

  if (view === 'idle') {
    return (
      <div className="mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={() => { setView('buscando'); setMsg(null) }}
          className="text-xs text-orange hover:underline font-body"
        >
          + Vincular con alumno con cuenta
        </button>
        {msg && (
          <p className={`mt-1 text-xs font-body ${msg.type === 'ok' ? 'text-green-600' : 'text-red-500'}`}>
            {msg.text}
          </p>
        )}
      </div>
    )
  }

  if (view === 'confirmando' && seleccionado) {
    return (
      <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
        <p className="text-xs font-body text-navy/70">
          ¿Vincular <span className="font-semibold text-navy">{nombreExterno}</span> con{' '}
          <span className="font-semibold text-navy">{seleccionado.nombre}</span>?
        </p>
        <p className="text-xs font-body text-navy/40">
          Las asistencias y cobros de ambos registros quedarán asociados al mismo alumno.
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleVincular}
            disabled={isPending}
            className="px-4 py-2 rounded-xl bg-orange text-white font-heading font-bold text-xs transition-all active:scale-95 disabled:opacity-50"
          >
            {isPending ? 'Vinculando...' : 'Confirmar'}
          </button>
          <button
            type="button"
            onClick={() => setView('buscando')}
            disabled={isPending}
            className="text-xs text-navy/40 hover:text-navy font-body"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={isPending}
            className="text-xs text-navy/40 hover:text-navy font-body"
          >
            Cancelar
          </button>
          {msg && (
            <p className={`text-xs font-body ${msg.type === 'ok' ? 'text-green-600' : 'text-red-500'}`}>
              {msg.text}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
      <input
        autoFocus
        type="text"
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        placeholder="Buscar alumno con cuenta..."
        className="w-full border border-gray-200 rounded-xl px-3 py-2 font-body text-sm text-navy focus:outline-none focus:ring-2 focus:ring-orange/40"
      />
      {filtrados.length > 0 ? (
        <ul className="border border-gray-100 rounded-xl divide-y divide-gray-50 overflow-hidden">
          {filtrados.map(a => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => { setSeleccionado(a); setView('confirmando') }}
                className="w-full text-left px-3 py-2 text-sm font-body text-navy hover:bg-orange/5 transition-colors"
              >
                {a.nombre}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs font-body text-navy/30">Sin resultados.</p>
      )}
      <button
        type="button"
        onClick={reset}
        className="text-xs text-navy/40 hover:text-navy font-body"
      >
        Cancelar
      </button>
    </div>
  )
}
