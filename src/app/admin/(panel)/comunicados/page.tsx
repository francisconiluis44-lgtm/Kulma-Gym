import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSession } from '@/lib/admin-auth'
import NuevoComunicadoForm from './NuevoComunicadoForm'
import ComunicadosList from './ComunicadosList'

export default async function ComunicadosAdminPage() {
  const { gimnasioId } = await getAdminSession()
  const adminSupabase = createAdminClient()

  const [{ data: comunicados }, { count: totalAlumnos }] = await Promise.all([
    adminSupabase
      .from('comunicados')
      .select('id, titulo, cuerpo, created_at')
      .eq('gimnasio_id', gimnasioId)
      .order('created_at', { ascending: false }),
    adminSupabase
      .from('alumnos')
      .select('*', { count: 'exact', head: true })
      .eq('gimnasio_id', gimnasioId),
  ])

  return (
    <>
      <h2 className="text-2xl font-heading font-bold text-navy mb-6">
        Comunicados
      </h2>

      <NuevoComunicadoForm totalAlumnos={totalAlumnos ?? 0} />

      <ComunicadosList comunicados={comunicados ?? []} />
    </>
  )
}
