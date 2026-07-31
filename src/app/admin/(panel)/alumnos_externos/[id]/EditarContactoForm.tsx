'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { actualizarContactoExterno } from './actions'

export default function EditarContactoForm({
  externoId,
  whatsappActual,
  emailActual,
}: {
  externoId: string
  whatsappActual: string | null
  emailActual: string | null
}) {
  const [open, setOpen] = useState(false)
  const [whatsapp, setWhatsapp] = useState(whatsappActual ?? '')
  const [email, setEmail] = useState(emailActual ?? '')
  const [msg, setMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    startTransition(async () => {
      const result = await actualizarContactoExterno(externoId, whatsapp || null, email || null)
      if ('ok' in result) {
        setMsg({ type: 'ok', text: 'Contacto actualizado.' })
        setOpen(false)
        router.refresh()
      } else {
        setMsg({ type: 'error', text: result.error })
      }
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-orange hover:underline font-body"
      >
        {whatsappActual || emailActual ? 'Editar contacto' : '+ Agregar contacto'}
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 mt-1">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[180px]">
          <span className="text-xs font-body text-navy/50 w-20 shrink-0">WhatsApp</span>
          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="Ej: 1134567890"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 font-body text-sm text-navy focus:outline-none focus:ring-2 focus:ring-orange/40"
          />
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-[180px]">
          <span className="text-xs font-body text-navy/50 w-20 shrink-0">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Ej: nombre@mail.com"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 font-body text-sm text-navy focus:outline-none focus:ring-2 focus:ring-orange/40"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 rounded-xl bg-orange text-white font-heading font-bold text-xs transition-all active:scale-95 disabled:opacity-50"
        >
          {isPending ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setMsg(null) }}
          className="text-xs text-navy/40 hover:text-navy font-body"
        >
          cancelar
        </button>
        {msg && (
          <p className={`text-xs font-body ${msg.type === 'ok' ? 'text-green-600' : 'text-red-500'}`}>
            {msg.text}
          </p>
        )}
      </div>
    </form>
  )
}
