import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import EditarForm from './EditarForm'

export default async function EditarAlumnoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const adminSupabase = createAdminClient()

  const { data: alumno } = await adminSupabase
    .from('alumnos')
    .select('*')
    .eq('id', id)
    .single()

  if (!alumno) notFound()

  return (
    <>
      <div className="mb-6">
        <Link
          href="/admin"
          className="text-sm text-navy/50 hover:text-navy font-body transition-colors"
        >
          ← Volver a alumnos
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm px-6 py-6 max-w-lg">
        <h2 className="text-xl font-heading font-bold text-navy mb-1">
          {alumno.nombre_completo}
        </h2>
        <p className="text-sm text-navy/50 font-body mb-6">
          DNI {alumno.dni} · WhatsApp {alumno.whatsapp}
        </p>

        <EditarForm
          alumnoId={alumno.id}
          rutina_url={alumno.rutina_url}
          fecha_vencimiento={alumno.fecha_vencimiento}
        />
      </div>
    </>
  )
}
