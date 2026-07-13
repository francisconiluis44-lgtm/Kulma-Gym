import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSession } from '@/lib/admin-auth'
import AlumnosBuscador from './AlumnosBuscador'

export default async function AdminAlumnosPage() {
  const { gimnasioId } = await getAdminSession()
  const adminSupabase = createAdminClient()
  const { data: alumnos } = await adminSupabase
    .from('alumnos')
    .select('id, nombre_completo, dni, fecha_alta, fecha_vencimiento, rutina_fecha_vencimiento')
    .eq('gimnasio_id', gimnasioId)
    .order('fecha_alta', { ascending: false })

  return (
    <>
      <div className="mb-6 flex items-baseline gap-3">
        <h2 className="text-2xl font-heading font-bold text-navy">Alumnos</h2>
        <span className="text-sm text-navy/50 font-body">
          {alumnos?.length ?? 0} en total
        </span>
      </div>
      <AlumnosBuscador alumnos={alumnos ?? []} />
    </>
  )
}
