import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSession } from '@/lib/admin-auth'
import EditarForm from './EditarForm'
import RegistrarPagoForm from './RegistrarPagoForm'

export default async function EditarAlumnoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { gimnasioId } = await getAdminSession()
  const adminSupabase = createAdminClient()

  const [{ data: alumno }, { data: cobros }] = await Promise.all([
    adminSupabase
      .from('alumnos')
      .select('*')
      .eq('id', id)
      .eq('gimnasio_id', gimnasioId)
      .single(),
    adminSupabase
      .from('cobros')
      .select('id, monto, fecha, metodo, notas')
      .eq('alumno_id', id)
      .eq('gimnasio_id', gimnasioId)
      .order('fecha', { ascending: false })
      .limit(10),
  ])

  if (!alumno) notFound()

  const hoy = new Date(new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }) + 'T00:00:00')

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

  function buildWaUrl() {
    if (!alumno || !alumno.whatsapp) return null
    const digits = alumno.whatsapp.replace(/\D/g, '')
    const normalized = digits.startsWith('0') ? digits.slice(1) : digits
    const phone = normalized.startsWith('54') ? normalized : `54${normalized}`
    const firstName = alumno.nombre_completo?.split(' ')[0] ?? 'Alumno'
    let texto: string
    if (alumno.fecha_vencimiento) {
      const dias = Math.ceil((new Date(alumno.fecha_vencimiento + 'T00:00:00').getTime() - hoy.getTime()) / 86400000)
      if (dias < 0) {
        texto = `Hola ${firstName}! 👋 Te escribimos desde Kulma Gym 🏋️\nTu membresía está vencida ⏳\nPasate a renovar así te tenemos un mes más con nosotros! 💪\n_(Mensaje automático)_`
      } else if (dias === 0) {
        texto = `Hola ${firstName}! 👋 Te escribimos desde Kulma Gym 🏋️\nTu membresía vence hoy ⏳\nPasate a renovar así te tenemos un mes más con nosotros! 💪\n_(Mensaje automático)_`
      } else if (dias <= 7) {
        texto = `Hola ${firstName}! 👋 Te escribimos desde Kulma Gym 🏋️\nTu membresía vence en ${dias} día${dias !== 1 ? 's' : ''} ⏳\nPasate a renovar así te tenemos un mes más con nosotros! 💪\n_(Mensaje automático)_`
      } else {
        texto = `Hola ${firstName}! 👋 Te escribimos desde Kulma Gym 🏋️\n¿Todo bien con el entrenamiento? 💪\n_(Mensaje automático)_`
      }
    } else {
      texto = `Hola ${firstName}! 👋 Te escribimos desde Kulma Gym 🏋️\n¿Todo bien con el entrenamiento? 💪\n_(Mensaje automático)_`
    }
    return `https://wa.me/${phone}?text=${encodeURIComponent(texto)}`
  }

  const waUrl = buildWaUrl()

  const OBJETIVO_LABELS: Record<string, string> = {
    perder_peso: 'Perder peso',
    ganar_musculo: 'Ganar músculo',
    mantenerme: 'Mantenerme',
    deportivo: 'Deportivo',
    otro: 'Otro',
  }

  return (
    <>
      <div className="mb-6">
        <Link
          href="/admin/alumnos"
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
        <div className="flex gap-2 mb-4">
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

        {waUrl ? (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold font-body rounded-xl transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.554 4.123 1.522 5.862L.057 23.486a.75.75 0 00.918.938l5.86-1.517A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.694-.525-5.222-1.438l-.374-.22-3.88 1.004 1.028-3.758-.242-.388A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            Enviar mensaje por WhatsApp
          </a>
        ) : (
          <p className="text-xs text-navy/30 font-body mb-6">Sin número de WhatsApp cargado.</p>
        )}

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

        {/* Cobros */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-xs font-semibold font-body text-navy/40 uppercase tracking-widest mb-4">
            Cobros
          </p>
          <RegistrarPagoForm
            alumnoId={alumno.id}
            fechaVencimientoActual={alumno.fecha_vencimiento}
          />
          {cobros && cobros.length > 0 && (
            <ul className="mt-4 space-y-2">
              {cobros.map((c) => (
                <li key={c.id} className="flex items-start justify-between gap-2 py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-heading font-bold text-navy">
                      ${c.monto.toLocaleString('es-AR')}
                    </p>
                    {c.notas && (
                      <p className="text-xs text-navy/40 font-body">{c.notas}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-navy/50 font-body tabular-nums">
                      {new Date(c.fecha + 'T00:00:00').toLocaleDateString('es-AR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                      })}
                    </p>
                    <span className="text-xs font-body bg-navy/5 text-navy/50 px-2 py-0.5 rounded-full capitalize">
                      {c.metodo}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}
