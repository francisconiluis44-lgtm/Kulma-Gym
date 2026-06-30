import { createAdminClient } from '@/lib/supabase/admin'
import { eliminarComunicado } from './actions'
import NuevoComunicadoForm from './NuevoComunicadoForm'

export default async function ComunicadosAdminPage() {
  const adminSupabase = createAdminClient()
  const { data: comunicados } = await adminSupabase
    .from('comunicados')
    .select('id, titulo, cuerpo, imagen_url, created_at')
    .order('created_at', { ascending: false })

  return (
    <>
      <h2 className="text-2xl font-heading font-bold text-navy mb-6">
        Comunicados
      </h2>

      <NuevoComunicadoForm />

      <div className="space-y-4">
        {!comunicados || comunicados.length === 0 ? (
          <p className="text-navy/40 font-body text-sm text-center py-8">
            No hay comunicados todavía.
          </p>
        ) : (
          comunicados.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl shadow-sm px-6 py-5 flex gap-4 items-start"
            >
              {c.imagen_url && (
                <img
                  src={c.imagen_url}
                  alt=""
                  className="w-20 h-20 rounded-xl object-cover shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-navy/40 font-body mb-1 tabular-nums">
                  {new Date(c.created_at).toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <h3 className="font-heading font-semibold text-navy mb-1">
                  {c.titulo}
                </h3>
                <p className="text-sm text-navy/70 font-body whitespace-pre-wrap">
                  {c.cuerpo}
                </p>
              </div>
              <form
                action={async () => {
                  'use server'
                  await eliminarComunicado(c.id)
                }}
              >
                <button
                  type="submit"
                  className="text-xs text-red-400 hover:text-red-600 font-body transition-colors shrink-0 mt-1"
                >
                  Eliminar
                </button>
              </form>
            </div>
          ))
        )}
      </div>
    </>
  )
}
