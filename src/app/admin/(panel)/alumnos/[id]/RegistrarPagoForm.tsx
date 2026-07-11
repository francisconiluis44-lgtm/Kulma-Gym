'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { registrarCobro } from '../../cobros/actions'

const METODOS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'otro', label: 'Otro' },
]

function todayAR() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
}

export default function RegistrarPagoForm({
  alumnoId,
  fechaVencimientoActual,
}: {
  alumnoId: string
  fechaVencimientoActual: string | null
}) {
  const [open, setOpen] = useState(false)
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(todayAR())
  const [metodo, setMetodo] = useState('efectivo')
  const [notas, setNotas] = useState('')
  const [actualizarVencimiento, setActualizarVencimiento] = useState(false)
  const [nuevaFechaVenc, setNuevaFechaVenc] = useState(fechaVencimientoActual ?? '')
  const [msg, setMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const montoNum = parseFloat(monto)
    if (!monto || isNaN(montoNum) || montoNum <= 0) return
    setMsg(null)

    startTransition(async () => {
      const result = await registrarCobro({
        alumnoId,
        monto: montoNum,
        fecha,
        metodo,
        notas: notas || undefined,
        nuevaFechaVencimiento: actualizarVencimiento && nuevaFechaVenc ? nuevaFechaVenc : undefined,
      })

      if ('ok' in result) {
        setMsg({ type: 'ok', text: 'Pago registrado.' })
        setMonto('')
        setNotas('')
        setActualizarVencimiento(false)
        setOpen(false)
        router.refresh()
      } else {
        setMsg({ type: 'error', text: result.error })
      }
    })
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => { setOpen(true); setMsg(null) }}
          className="w-full py-3 rounded-xl bg-orange text-white font-heading font-bold text-sm transition-all active:scale-95"
        >
          + Registrar pago
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-heading font-bold text-navy">Nuevo pago</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-navy/40 hover:text-navy font-body"
            >
              cancelar
            </button>
          </div>

          {/* Monto */}
          <div>
            <label className="text-xs font-body text-navy/50 block mb-1">Monto ($)</label>
            <input
              type="number"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0"
              min="0"
              step="0.01"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 font-body text-sm text-navy focus:outline-none focus:ring-2 focus:ring-orange/40"
            />
          </div>

          {/* Método + Fecha */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-body text-navy/50 block mb-1">Método</label>
              <select
                value={metodo}
                onChange={(e) => setMetodo(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-3 font-body text-sm text-navy focus:outline-none focus:ring-2 focus:ring-orange/40 bg-white"
              >
                {METODOS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-body text-navy/50 block mb-1">Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-3 font-body text-sm text-navy focus:outline-none focus:ring-2 focus:ring-orange/40"
              />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="text-xs font-body text-navy/50 block mb-1">Notas (opcional)</label>
            <input
              type="text"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="ej: promo 2x1, descuento..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 font-body text-sm text-navy focus:outline-none focus:ring-2 focus:ring-orange/40"
            />
          </div>

          {/* Actualizar vencimiento */}
          <div className="border border-gray-100 rounded-xl px-4 py-3 space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={actualizarVencimiento}
                onChange={(e) => setActualizarVencimiento(e.target.checked)}
                className="w-4 h-4 accent-orange"
              />
              <span className="text-sm font-body text-navy">Actualizar fecha de membresía</span>
            </label>
            {actualizarVencimiento && (
              <input
                type="date"
                value={nuevaFechaVenc}
                onChange={(e) => setNuevaFechaVenc(e.target.value)}
                required={actualizarVencimiento}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 font-body text-sm text-navy focus:outline-none focus:ring-2 focus:ring-orange/40"
              />
            )}
          </div>

          <button
            type="submit"
            disabled={isPending || !monto}
            className="w-full py-3 rounded-xl bg-orange text-white font-heading font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
          >
            {isPending ? 'Guardando...' : 'Guardar pago'}
          </button>

          {msg && (
            <p className={`text-sm font-body ${msg.type === 'ok' ? 'text-green-600' : 'text-red-500'}`}>
              {msg.text}
            </p>
          )}
        </form>
      )}
    </div>
  )
}
