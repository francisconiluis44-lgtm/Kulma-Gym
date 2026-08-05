import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSession } from '@/lib/admin-auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import CancelarClaseBtn from './CancelarClaseBtn'

export const dynamic = 'force-dynamic'

export default async function ClaseDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { gimnasioId } = await getAdminSession()
  const { id } = await params
  const adminSupabase = createAdminClient()

  const [{ data: clase }, { data: reservas }] = await Promise.all([
    adminSupabase
      .from('clases')
      .select('*')
      .eq('id', id)
      .eq('gimnasio_id', gimnasioId)
      .single(),
    adminSupabase
      .from('reservas')
      .select('id, alumno_id, estado, created_at')
      .eq('clase_id', id)
      .order('created_at'),
  ])

  if (!clase) notFound()

  const confirmadas = (reservas ?? []).filter(r => r.estado === 'confirmada')
  const canceladas = (reservas ?? []).filter(r => r.estado === 'cancelada')

  const alumnoIds = (reservas ?? []).map(r => r.alumno_id)
  const { data: alumnos } = alumnoIds.length > 0
    ? await adminSupabase.from('alumnos').select('id, nombre_completo').in('id', alumnoIds)
    : { data: [] }

  const alumnoMap = new Map((alumnos ?? []).map(a => [a.id, a.nombre_completo]))

  const fechaHoraLabel = new Date(clase.fecha_hora).toLocaleDateString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const horaLabel = new Date(clase.fecha_hora).toLocaleTimeString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/clases" className="text-navy/40 hover:text-navy transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h2 className="text-2xl font-heading font-extrabold text-navy truncate">{clase.titulo}</h2>
        {clase.cancelada && (
          <span className="ml-auto flex-shrink-0 text-xs font-body font-semibold bg-red-100 text-red-500 px-2 py-1 rounded-full">
            Cancelada
          </span>
        )}
      </div>

      {/* Class info */}
      <div className="bg-white rounded-2xl shadow-sm px-6 py-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-body font-semibold tracking-widest text-orange uppercase">Detalles</span>
        </div>
        <div className="space-y-2 text-sm font-body text-navy">
          <div className="flex items-center gap-2">
            <span className="text-navy/40 w-20">Fecha</span>
            <span className="capitalize">{fechaHoraLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-navy/40 w-20">Hora</span>
            <span>{horaLabel} hs · {clase.duracion_min} min</span>
          </div>
          {clase.instructor && (
            <div className="flex items-center gap-2">
              <span className="text-navy/40 w-20">Instructor</span>
              <span>{clase.instructor}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-navy/40 w-20">Cupo</span>
            <span>{confirmadas.length} / {clase.capacidad_max}</span>
          </div>
          {clase.descripcion && (
            <div className="flex gap-2">
              <span className="text-navy/40 w-20 shrink-0">Descripción</span>
              <span className="text-navy/80">{clase.descripcion}</span>
            </div>
          )}
        </div>
      </div>

      {/* Attendees */}
      <div className="bg-white rounded-2xl shadow-sm px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-body font-semibold tracking-widest text-orange uppercase">
            Inscriptos
          </p>
          <span className="text-2xl font-heading font-extrabold text-navy">{confirmadas.length}</span>
        </div>

        {confirmadas.length === 0 ? (
          <p className="text-navy/40 font-body text-sm">Nadie reservó todavía.</p>
        ) : (
          <ul className="space-y-0 divide-y divide-gray-50">
            {confirmadas.map(r => (
              <li key={r.id} className="flex items-center justify-between py-2.5">
                <span className="font-body text-sm text-navy">
                  {alumnoMap.get(r.alumno_id) ?? '—'}
                </span>
                <Link
                  href={`/admin/alumnos/${r.alumno_id}`}
                  className="text-xs font-body text-orange hover:underline"
                >
                  Ver
                </Link>
              </li>
            ))}
          </ul>
        )}

        {canceladas.length > 0 && (
          <p className="text-xs font-body text-navy/30 mt-3">
            {canceladas.length} cancelaron su reserva
          </p>
        )}
      </div>

      {/* Cancel action */}
      {!clase.cancelada && (
        <div className="bg-white rounded-2xl shadow-sm px-6 py-6">
          <CancelarClaseBtn claseId={clase.id} />
        </div>
      )}
    </div>
  )
}
