import { createAdminClient } from '@/lib/supabase/admin'
import { getGaleriaSession } from '@/lib/galeria-auth'
import NuevaCarpetaForm from './NuevaCarpetaForm'
import CarpetaCard from './CarpetaCard'

export default async function GaleriaPage() {
  await getGaleriaSession()
  const adminSupabase = createAdminClient()

  const [{ data: carpetas }, { data: archivos }] = await Promise.all([
    adminSupabase.from('galeria_carpetas').select('*').order('created_at', { ascending: false }),
    adminSupabase.from('galeria_archivos').select('id, carpeta_id'),
  ])

  function countFor(carpetaId: string) {
    return (archivos ?? []).filter((a) => a.carpeta_id === carpetaId).length
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-heading font-bold text-white">Carpetas</h2>
        <p className="text-sm text-white/40 font-body mt-0.5">
          Organizá tus fotos y videos para compartirlos fácil
        </p>
      </div>

      <NuevaCarpetaForm />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
        {!carpetas || carpetas.length === 0 ? (
          <p className="col-span-full text-white/30 font-body text-sm text-center py-16">
            No hay carpetas todavía. Creá la primera arriba.
          </p>
        ) : (
          carpetas.map((c) => (
            <CarpetaCard key={c.id} carpeta={c} cantidad={countFor(c.id)} />
          ))
        )}
      </div>
    </>
  )
}
