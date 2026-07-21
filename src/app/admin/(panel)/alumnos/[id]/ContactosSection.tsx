'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

const MOTIVOS = [
  { value: 'renovacion_vencida', label: 'Membresía vencida' },
  { value: 'por_vencer', label: 'Próxima a vencer' },
  { value: 'reactivacion', label: 'Reactivación' },
  { value: 'otro', label: 'Otro' },
]

const CANALES = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'llamada', label: 'Llamada' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'email', label: 'Email' },
  { value: 'otro', label: 'Otro' },
]

const RESULTADOS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'sin_respuesta', label: 'Sin respuesta' },
  { value: 'respondio', label: 'Respondió' },
  { value: 'renovo', label: 'Renovó' },
  { value: 'rechazo', label: 'Rechazó' },
  { value: 'contactar_mas_adelante', label: 'Contactar más adelante' },
]

const RESULTADO_COLORS: Record<string, string> = {
  renovo: 'bg-green-100 text-green-700',
  respondio: 'bg-blue-50 text-blue-600',
  rechazo: 'bg-red-100 text-red-600',
  sin_respuesta: 'bg-gray-100 text-gray-500',
  pendiente: 'bg-orange/10 text-orange',
  contactar_mas_adelante: 'bg-yellow-50 text-yellow-600',
}

type Contacto = {
  id: string
  motivo: string
  canal: string
  fecha_contacto: string
  resultado: string
  observacion: string | null
}

function UpdateResultadoInline({ contactoId, alumnoId, onDone }: { contactoId: string; alumnoId: string; onDone: () => void }) {
  const [resultado, setResultado] = useState('sin_respuesta')
  const [observacion, setObservacion] = useState('')
  const [msg, setMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/alumnos/${alumnoId}/contactos`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contactoId, resultado, observacion: observacion.trim() || undefined }),
        })
        if (!res.ok) {
          const data = await res.json()
          setMsg({ type: 'error', text: data.error ?? 'Error al actualizar.' })
          return
        }
        onDone()
      } catch {
        setMsg({ type: 'error', text: 'Error de conexión.' })
      }
    })
  }

  return (
    <form onSubmit={handleUpdate} className="mt-2 bg-gray-50 rounded-xl px-3 py-3 space-y-2">
      <p className="text-xs font-semibold font-body text-navy/50">Actualizar resultado</p>
      <select
        value={resultado}
        onChange={e => setResultado(e.target.value)}
        className="w-full text-sm font-body border border-gray-200 rounded-lg px-3 py-2 text-navy focus:outline-none focus:ring-2 focus:ring-orange/30"
      >
        {RESULTADOS.filter(r => r.value !== 'pendiente').map(r => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>
      <textarea
        value={observacion}
        onChange={e => setObservacion(e.target.value)}
        rows={2}
        maxLength={500}
        placeholder="Observación opcional..."
        className="w-full text-sm font-body border border-gray-200 rounded-lg px-3 py-2 text-navy focus:outline-none focus:ring-2 focus:ring-orange/30 resize-none"
      />
      {msg && (
        <p className={`text-xs font-body ${msg.type === 'ok' ? 'text-green-600' : 'text-red-500'}`}>{msg.text}</p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 py-2 bg-orange text-white text-xs font-semibold font-body rounded-lg hover:bg-orange/90 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="px-3 py-2 text-xs font-body text-navy/50 hover:text-navy transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

export default function ContactosSection({
  alumnoId,
  contactosIniciales,
}: {
  alumnoId: string
  contactosIniciales: Contacto[]
}) {
  const [open, setOpen] = useState(false)
  const [motivo, setMotivo] = useState('renovacion_vencida')
  const [canal, setCanal] = useState('whatsapp')
  const [resultado, setResultado] = useState('pendiente')
  const [observacion, setObservacion] = useState('')
  const [msg, setMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/alumnos/${alumnoId}/contactos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ motivo, canal, resultado, observacion: observacion.trim() || undefined }),
        })
        if (!res.ok) {
          const data = await res.json()
          setMsg({ type: 'error', text: data.error ?? 'Error al registrar.' })
          return
        }
        setMsg({ type: 'ok', text: 'Contacto registrado.' })
        setOpen(false)
        setObservacion('')
        setResultado('pendiente')
        router.refresh()
      } catch {
        setMsg({ type: 'error', text: 'Error de conexión.' })
      }
    })
  }

  return (
    <div className="mt-6 pt-6 border-t border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold font-body text-navy/40 uppercase tracking-widest">
          Contactos
        </p>
        <button
          onClick={() => { setOpen(o => !o); setMsg(null) }}
          className="text-xs font-body font-semibold text-orange hover:text-orange/80 transition-colors"
        >
          {open ? 'Cancelar' : '+ Registrar'}
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="mb-4 space-y-3 bg-gray-50 rounded-xl px-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-body text-navy/50 mb-1 block">Motivo</label>
              <select
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                className="w-full text-sm font-body border border-gray-200 rounded-lg px-3 py-2 text-navy focus:outline-none focus:ring-2 focus:ring-orange/30"
              >
                {MOTIVOS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-body text-navy/50 mb-1 block">Canal</label>
              <select
                value={canal}
                onChange={e => setCanal(e.target.value)}
                className="w-full text-sm font-body border border-gray-200 rounded-lg px-3 py-2 text-navy focus:outline-none focus:ring-2 focus:ring-orange/30"
              >
                {CANALES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-body text-navy/50 mb-1 block">Resultado</label>
            <select
              value={resultado}
              onChange={e => setResultado(e.target.value)}
              className="w-full text-sm font-body border border-gray-200 rounded-lg px-3 py-2 text-navy focus:outline-none focus:ring-2 focus:ring-orange/30"
            >
              {RESULTADOS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-body text-navy/50 mb-1 block">Observación (opcional)</label>
            <textarea
              value={observacion}
              onChange={e => setObservacion(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Qué dijo, qué acordaron..."
              className="w-full text-sm font-body border border-gray-200 rounded-lg px-3 py-2 text-navy focus:outline-none focus:ring-2 focus:ring-orange/30 resize-none"
            />
          </div>

          {msg && (
            <p className={`text-xs font-body ${msg.type === 'ok' ? 'text-green-600' : 'text-red-500'}`}>
              {msg.text}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 bg-orange text-white text-sm font-semibold font-body rounded-xl hover:bg-orange/90 transition-colors disabled:opacity-50"
          >
            {isPending ? 'Guardando...' : 'Guardar contacto'}
          </button>
        </form>
      )}

      {contactosIniciales.length === 0 ? (
        <p className="text-xs text-navy/30 font-body">Sin contactos registrados.</p>
      ) : (
        <ul className="space-y-2">
          {contactosIniciales.map(c => {
            const resultadoLabel = RESULTADOS.find(r => r.value === c.resultado)?.label ?? c.resultado
            const motivoLabel = MOTIVOS.find(m => m.value === c.motivo)?.label ?? c.motivo
            const canalLabel = CANALES.find(ch => ch.value === c.canal)?.label ?? c.canal
            const isPendiente = c.resultado === 'pendiente'
            return (
              <li key={c.id} className="py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-semibold font-body px-2 py-0.5 rounded-full ${RESULTADO_COLORS[c.resultado] ?? 'bg-gray-100 text-gray-500'}`}>
                      {resultadoLabel}
                    </span>
                    <span className="text-xs text-navy/50 font-body">{motivoLabel} · {canalLabel}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isPendiente && updatingId !== c.id && (
                      <button
                        onClick={() => setUpdatingId(c.id)}
                        className="text-xs font-body text-orange hover:text-orange/70 transition-colors"
                      >
                        Actualizar
                      </button>
                    )}
                    <span className="text-xs text-navy/40 font-body tabular-nums">
                      {new Date(c.fecha_contacto + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                {c.observacion && (
                  <p className="text-xs text-navy/50 font-body mt-1 pl-1">{c.observacion}</p>
                )}
                {updatingId === c.id && (
                  <UpdateResultadoInline
                    contactoId={c.id}
                    alumnoId={alumnoId}
                    onDone={() => { setUpdatingId(null); router.refresh() }}
                  />
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
