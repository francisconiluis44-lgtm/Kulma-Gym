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

export default function RegistrarContactoModal({
  alumnoId,
  alumnoNombre,
  motivoDefault = 'renovacion_vencida',
  label = 'Contacto',
}: {
  alumnoId: string
  alumnoNombre: string
  motivoDefault?: string
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const [motivo, setMotivo] = useState(motivoDefault)
  const [canal, setCanal] = useState('whatsapp')
  const [resultado, setResultado] = useState('pendiente')
  const [observacion, setObservacion] = useState('')
  const [msg, setMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function close() {
    setOpen(false)
    setMsg(null)
    setObservacion('')
    setResultado('pendiente')
    setMotivo(motivoDefault)
    setCanal('whatsapp')
  }

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
        setMsg({ type: 'ok', text: 'Registrado.' })
        setTimeout(() => { close(); router.refresh() }, 800)
      } catch {
        setMsg({ type: 'error', text: 'Error de conexión.' })
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-semibold font-body text-orange hover:text-orange/70 transition-colors shrink-0"
      >
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
          <div className="absolute inset-0 bg-black/30" onClick={close} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm px-5 py-5 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-heading font-bold text-navy">Registrar contacto</p>
              <button onClick={close} className="text-navy/30 hover:text-navy text-lg leading-none">×</button>
            </div>
            <p className="text-xs text-navy/50 font-body -mt-1">{alumnoNombre}</p>

            <form onSubmit={handleSubmit} className="space-y-3">
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
                {isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
