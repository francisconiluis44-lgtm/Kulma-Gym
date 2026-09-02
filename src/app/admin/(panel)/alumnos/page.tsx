import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSession } from '@/lib/admin-auth'
import AlumnosBuscador from './AlumnosBuscador'

export default async function AdminAlumnosPage() {
  const { gimnasioId } = await getAdminSession()
  const adminSupabase = createAdminClient()

  const [{ data: alumnos }, { data: externos }, { data: archivados }] = await Promise.all([
    adminSupabase
      .from('alumnos')
      .select('id, nombre_completo, dni, fecha_alta, fecha_vencimiento, rutina_fecha_vencimiento')
      .eq('gimnasio_id', gimnasioId)
      .eq('archivado', false)
      .order('fecha_alta', { ascending: false }),
    adminSupabase
      .from('alumnos_externos')
      .select('id, nombre_completo, fecha_vencimiento')
      .eq('gimnasio_id', gimnasioId)
      .is('alumno_id', null)
      .order('nombre_completo'),
    adminSupabase
      .from('alumnos')
      .select('id, nombre_completo, dni, fecha_alta, fecha_vencimiento, rutina_fecha_vencimiento')
      .eq('gimnasio_id', gimnasioId)
      .eq('archivado', true)
      .order('nombre_completo'),
  ])

  return (
    <>
      <div className="mb-6 flex items-baseline gap-3 flex-wrap">
        <h2 className="text-2xl font-heading font-bold text-navy">Alumnos</h2>
        <span className="text-sm text-navy/50 font-body">
          {alumnos?.length ?? 0} con cuenta
        </span>
        {externos && externos.length > 0 && (
          <span className="text-sm font-body text-navy/40">
            · {externos.length} sin cuenta
          </span>
        )}
        {archivados && archivados.length > 0 && (
          <span className="text-sm font-body text-navy/30">
            · {archivados.length} archivados
          </span>
        )}
      </div>
      <AlumnosBuscador alumnos={alumnos ?? []} externos={externos ?? []} archivados={archivados ?? []} />
    </>
  )
}
