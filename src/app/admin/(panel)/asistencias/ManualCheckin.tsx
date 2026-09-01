'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { registrarCheckinManual, registrarCheckinManualExterno } from './actions'
import type { Alumno } from '@/types/database'

type Item = { id: string; nombre_completo: string; tipo: 'con_cuenta' | 'sin_cuenta' }

export default function ManualCheckin({
  alumnos,
  externos,
}: {
  alumnos: Pick<Alumno, 'id' | 'nombre_completo'>[]
  externos: { id: string; nombre_completo: string }[]
}) {
  const [q, setQ] = useState('')
  const [seleccionado, setSeleccionado] = useState<Item | null>(null)
  const [msg, setMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const todos: Item[] = [
    ...alumnos.map(a => ({ ...a, tipo: 'con_cuenta' as const })),
    ...externos.map(e => ({ ...e, tipo: 'sin_cuenta' as const })),
  ]

  const resultados = q.trim().length === 0 ? [] : todos.filter(a =>
    a.nombre_completo.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(
      q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    )
  ).slice(0, 8)

  function seleccionar(item: Item) {
    setSeleccionado(item)
    setQ('')
    setMsg(null)
  }

  function limpiar() {
    setSeleccionado(null)
    setQ('')
    setMsg(null)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!seleccionado) return
    setMsg(null)
    startTransition(async () => {
      const result = seleccionado.tipo === 'sin_cuenta'
        ? await registrarCheckinManualExterno(seleccionado.id)
        : await registrarCheckinManual(seleccionado.id)

      if ('ok' in result) {
        setMsg({ type: 'ok', text: 'Asistencia registrada.' })
        setSeleccionado(null)
        setQ('')
        router.refresh()
      } else if (result.error === 'ya_registrada') {
        setMsg({ type: 'error', text: 'Este alumno ya registró asistencia hoy.' })
      } else {
        setMsg({ type: 'error', text: result.error })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {seleccionado ? (
        <div className="flex items-center justify-between px-4 py-3 bg-navy/5 rounded-xl border border-navy/15">
          <div className="flex items-center gap-2">
            <span className="font-body text-sm text-navy font-semibold">{seleccionado.nombre_completo}</span>
            {seleccionado.tipo === 'sin_cuenta' && (
              <span className="text-xs font-body bg-navy/10 text-navy/50 px-2 py-0.5 rounded-full">sin cuenta</span>
            )}
          </div>
          <button type="button" onClick={limpiar} className="text-xs font-body text-navy/40 hover:text-navy/70 transition-colors">
            Cambiar
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscá por nombre o apellido…"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 font-body text-sm text-navy focus:outline-none focus:ring-2 focus:ring-orange/40 bg-white placeholder:text-navy/30"
          />
          {resultados.length > 0 && (
            <ul className="absolute z-10 w-full mt-1 bg-white border border-navy/10 rounded-xl shadow-lg overflow-hidden">
              {resultados.map(a => (
                <li key={`${a.tipo}-${a.id}`}>
                  <button
                    type="button"
                    onClick={() => seleccionar(a)}
                    className="w-full text-left px-4 py-2.5 text-sm font-body text-navy hover:bg-orange/5 transition-colors border-b border-navy/5 last:border-0 flex items-center justify-between gap-2"
                  >
                    <span>{a.nombre_completo}</span>
                    {a.tipo === 'sin_cuenta' && (
                      <span className="text-xs text-navy/30 shrink-0">sin cuenta</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {q.trim().length >= 2 && resultados.length === 0 && (
            <p className="mt-2 text-xs font-body text-navy/40 px-1">Sin resultados para &ldquo;{q}&rdquo;</p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || !seleccionado}
        className="py-3 rounded-xl bg-navy text-white font-heading font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
      >
        {isPending ? 'Registrando...' : 'Registrar asistencia manual'}
      </button>

      {msg && (
        <p className={`text-sm font-body ${msg.type === 'ok' ? 'text-green-600' : 'text-red-500'}`}>
          {msg.text}
        </p>
      )}
    </form>
  )
}
