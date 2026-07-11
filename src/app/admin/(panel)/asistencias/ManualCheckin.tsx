'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { registrarCheckinManual } from './actions'
import type { Alumno } from '@/types/database'

export default function ManualCheckin({ alumnos }: { alumnos: Pick<Alumno, 'id' | 'nombre_completo'>[] }) {
  const [alumnoId, setAlumnoId] = useState('')
  const [msg, setMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!alumnoId) return
    setMsg(null)
    startTransition(async () => {
      const result = await registrarCheckinManual(alumnoId)
      if ('ok' in result) {
        setMsg({ type: 'ok', text: 'Asistencia registrada.' })
        setAlumnoId('')
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
      <select
        value={alumnoId}
        onChange={(e) => setAlumnoId(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 font-body text-sm text-navy focus:outline-none focus:ring-2 focus:ring-orange/40 bg-white"
        required
      >
        <option value="">Seleccioná un alumno</option>
        {alumnos.map((a) => (
          <option key={a.id} value={a.id}>
            {a.nombre_completo}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={isPending || !alumnoId}
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
