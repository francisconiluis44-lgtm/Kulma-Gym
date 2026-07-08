'use client'
import { useActionState } from 'react'
import { agregarAdmin } from './actions'

const initial = { error: null as string | null, ok: false }

export default function AgregarAdminForm({ gimnasioId }: { gimnasioId: string }) {
  const [state, formAction, pending] = useActionState(agregarAdmin, initial)

  return (
    <form action={formAction} className="flex gap-2">
      <input type="hidden" name="gimnasio_id" value={gimnasioId} />
      <input
        name="email"
        type="email"
        required
        placeholder="email@usuario.com"
        className="flex-1 min-w-0 bg-gray-800 border border-gray-700 text-white font-body text-xs rounded-lg px-3 py-2 placeholder-white/20 focus:outline-none focus:border-orange"
      />
      <button
        type="submit"
        disabled={pending}
        className="bg-orange text-white text-xs font-semibold font-body px-3 py-2 rounded-lg hover:bg-orange/90 active:scale-95 transition-all disabled:opacity-50 shrink-0"
      >
        {pending ? '…' : 'Agregar'}
      </button>
      {state.error && (
        <p className="text-red-400 text-xs font-body mt-1 w-full">{state.error}</p>
      )}
    </form>
  )
}
