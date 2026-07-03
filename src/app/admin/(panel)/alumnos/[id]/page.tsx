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

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  function calcBadge(fecha: string | null) {
    if (!fecha) return null
    const dias = Math.ceil((new Date(fecha + 'T00:00:00').getTime() - hoy.getTime()) / 86400000)
    if (dias < 0) return { text: 'Vencida', cn: 'bg-red-100 text-red-600' }
    if (dias === 0) return { text: 'Vence hoy', cn: 'bg-orange/20 text-orange' }
    if (dias <= 7) return { text: `${dias}d`, cn: 'bg-orange/20 text-orange' }
    return { text: `${dias}d`, cn: 'bg-green-100 text-green-700' }
  }

  const membresiaBadge = calcBadge(alumno.fecha_vencimiento)
  const rutinaBadge = calcBadge(alumno.rutina_fecha_vencimiento)

  const OBJETIVO_LABELS: Record<string, string> = {
    perder_peso: 'Perder peso',
    ganar_musculo: 'Ganar músculo',
    mantenerme: 'Mantenerme',
    otro: 'Otro',
  }

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
        <p className="text-sm text-navy/50 font-body mb-3">
          DNI {alumno.dni} · WhatsApp {alumno.whatsapp}
        </p>
        <div className="flex gap-2 mb-6">
          <span className="text-xs font-body text-navy/50">Membresía:</span>
          {membresiaBadge ? (
            <span className={`text-xs font-semibold font-body px-2 py-0.5 rounded-full ${membresiaBadge.cn}`}>
              {membresiaBadge.text}
            </span>
          ) : (
            <span className="text-xs text-navy/30 font-body">sin fecha</span>
          )}
          <span className="text-xs font-body text-navy/50 ml-2">Rutina:</span>
          {rutinaBadge ? (
            <span className={`text-xs font-semibold font-body px-2 py-0.5 rounded-full ${rutinaBadge.cn}`}>
              {rutinaBadge.text}
            </span>
          ) : (
            <span className="text-xs text-navy/30 font-body">sin fecha</span>
          )}
        </div>

        {(alumno.peso || alumno.altura || alumno.lesiones || alumno.objetivo || alumno.fecha_nacimiento) && (
          <div className="mb-6 pt-5 border-t border-gray-100">
            <p className="text-xs font-semibold font-body text-navy/40 uppercase tracking-widest mb-3">
              Datos del alumno
            </p>
            <dl className="space-y-2">
              {alumno.fecha_nacimiento && (
                <div className="flex gap-3">
                  <dt className="text-xs text-navy/50 font-body w-24 shrink-0">Nacimiento</dt>
                  <dd className="text-xs font-body text-navy">
                    {new Date(alumno.fecha_nacimiento + 'T00:00:00').toLocaleDateString('es-AR', {
                      day: '2-digit', month: 'long', year: 'numeric',
                    })}
                  </dd>
                </div>
              )}
              {alumno.peso && (
                <div className="flex gap-3">
                  <dt className="text-xs text-navy/50 font-body w-24 shrink-0">Peso</dt>
                  <dd className="text-xs font-body text-navy">{alumno.peso} kg</dd>
                </div>
              )}
              {alumno.altura && (
                <div className="flex gap-3">
                  <dt className="text-xs text-navy/50 font-body w-24 shrink-0">Altura</dt>
                  <dd className="text-xs font-body text-navy">{alumno.altura} cm</dd>
                </div>
              )}
              {alumno.objetivo && (
                <div className="flex gap-3">
                  <dt className="text-xs text-navy/50 font-body w-24 shrink-0">Objetivo</dt>
                  <dd className="text-xs font-body text-navy">
                    {OBJETIVO_LABELS[alumno.objetivo] ?? alumno.objetivo}
                  </dd>
                </div>
              )}
              {alumno.lesiones && (
                <div className="flex gap-3">
                  <dt className="text-xs text-navy/50 font-body w-24 shrink-0">Lesiones</dt>
                  <dd className="text-xs font-body text-navy">{alumno.lesiones}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        <EditarForm
          alumnoId={alumno.id}
          rutina_url={alumno.rutina_url}
          fecha_vencimiento={alumno.fecha_vencimiento}
          rutina_fecha_vencimiento={alumno.rutina_fecha_vencimiento}
        />
      </div>
    </>
  )
}
