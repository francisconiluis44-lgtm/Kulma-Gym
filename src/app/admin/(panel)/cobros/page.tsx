import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSession } from '@/lib/admin-auth'
import AnularCobroModal from './AnularCobroModal'

export const dynamic = 'force-dynamic'

const METODO_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
  otro: 'Otro',
}

export default async function CobrosPage() {
  const { gimnasioId } = await getAdminSession()
  const adminSupabase = createAdminClient()

  const hoyAR = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
  const hoy = new Date(hoyAR + 'T00:00:00')
  const en7dias = new Date(hoy)
  en7dias.setDate(hoy.getDate() + 7)
  const en7diasStr = en7dias.toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })

  // First of this month
  const primerDiaMes = hoyAR.slice(0, 7) + '-01'

  const [
    { data: vencidos },
    { data: porVencer },
    { data: cobrosMes },
    { data: alumnosMap },
  ] = await Promise.all([
    adminSupabase
      .from('alumnos')
      .select('id, nombre_completo, fecha_vencimiento, whatsapp')
      .eq('gimnasio_id', gimnasioId)
      .not('fecha_vencimiento', 'is', null)
      .lt('fecha_vencimiento', hoyAR)
      .order('fecha_vencimiento', { ascending: true }),
    adminSupabase
      .from('alumnos')
      .select('id, nombre_completo, fecha_vencimiento, whatsapp')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha_vencimiento', hoyAR)
      .lte('fecha_vencimiento', en7diasStr)
      .order('fecha_vencimiento', { ascending: true }),
    adminSupabase
      .from('cobros')
      .select('id, alumno_id, monto, fecha, metodo, notas, estado')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha', primerDiaMes)
      .order('fecha', { ascending: false }),
    adminSupabase
      .from('alumnos')
      .select('id, nombre_completo')
      .eq('gimnasio_id', gimnasioId),
  ])

  const nombreMap = new Map((alumnosMap ?? []).map((a) => [a.id, a.nombre_completo]))
  const cobrosActivos = (cobrosMes ?? []).filter((c) => c.estado !== 'anulado')
  const totalMes = cobrosActivos.reduce((sum, c) => sum + c.monto, 0)

  function buildWaUrl(
    nombre: string,
    whatsapp: string | null,
    fechaVencimiento: string | null,
    dias: number,
    tipo: 'vencido' | 'por_vencer',
  ) {
    if (!whatsapp) return null
    const digits = whatsapp.replace(/\D/g, '')
    const normalized = digits.startsWith('0') ? digits.slice(1) : digits
    const phone = normalized.startsWith('54') ? normalized : `54${normalized}`
    const firstName = nombre.split(' ')[0] ?? 'Alumno'
    const texto = tipo === 'vencido'
      ? `Hola ${firstName}! 👋 Te escribimos desde Kulma Gym 🏋️\nTu membresía está vencida ⏳\nPasate a renovar así te tenemos un mes más con nosotros! 💪\n_(Mensaje automático)_`
      : `Hola ${firstName}! 👋 Te escribimos desde Kulma Gym 🏋️\nTu membresía vence en ${dias} día${dias !== 1 ? 's' : ''} ⏳\nPasate a renovar así te tenemos un mes más con nosotros! 💪\n_(Mensaje automático)_`
    return `https://wa.me/${phone}?text=${encodeURIComponent(texto)}`
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h2 className="text-2xl font-heading font-extrabold text-navy">Cobros</h2>
      </div>

      {/* Resumen del mes */}
      <div className="bg-white rounded-2xl shadow-sm px-6 py-5">
        <p className="text-xs font-body font-semibold tracking-widest text-orange uppercase mb-3">
          Este mes
        </p>
        <div className="flex items-end gap-1">
          <span className="text-3xl font-heading font-extrabold text-navy">
            ${totalMes.toLocaleString('es-AR')}
          </span>
          <span className="text-sm text-navy/40 font-body mb-1">
            · {cobrosActivos.length} cobro{cobrosActivos.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Vencidos */}
      {(vencidos ?? []).length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm px-6 py-5">
          <p className="text-xs font-body font-semibold tracking-widest text-red-500 uppercase mb-3">
            Membresía vencida ({vencidos!.length})
          </p>
          <ul className="space-y-2">
            {vencidos!.map((a) => {
              const dias = Math.ceil(
                (hoy.getTime() - new Date(a.fecha_vencimiento! + 'T00:00:00').getTime()) / 86400000
              )
              const waUrl = buildWaUrl(a.nombre_completo, a.whatsapp, a.fecha_vencimiento, dias, 'vencido')
              return (
                <li key={a.id} className="flex items-center justify-between gap-2">
                  <span className="text-sm font-body text-navy truncate">
                    {a.nombre_completo}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-body text-red-500 tabular-nums mr-1">
                      hace {dias}d
                    </span>
                    <Link
                      href={`/admin/alumnos/${a.id}`}
                      title="Ver perfil"
                      className="flex items-center justify-center w-7 h-7 rounded-full bg-navy/5 hover:bg-navy/10 text-navy/50 hover:text-navy transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                      </svg>
                    </Link>
                    {waUrl ? (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Enviar mensaje por WhatsApp"
                        className="flex items-center justify-center w-7 h-7 rounded-full bg-green-50 hover:bg-green-100 text-green-600 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.554 4.123 1.522 5.862L.057 23.486a.75.75 0 00.918.938l5.86-1.517A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.694-.525-5.222-1.438l-.374-.22-3.88 1.004 1.028-3.758-.242-.388A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                        </svg>
                      </a>
                    ) : (
                      <div className="w-7 h-7" />
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Por vencer */}
      {(porVencer ?? []).length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm px-6 py-5">
          <p className="text-xs font-body font-semibold tracking-widest text-orange uppercase mb-3">
            Por vencer (próximos 7 días)
          </p>
          <ul className="space-y-2">
            {porVencer!.map((a) => {
              const dias = Math.ceil(
                (new Date(a.fecha_vencimiento! + 'T00:00:00').getTime() - hoy.getTime()) / 86400000
              )
              const waUrl = buildWaUrl(a.nombre_completo, a.whatsapp, a.fecha_vencimiento, dias, 'por_vencer')
              return (
                <li key={a.id} className="flex items-center justify-between gap-2">
                  <span className="text-sm font-body text-navy truncate">
                    {a.nombre_completo}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-body text-orange tabular-nums mr-1">
                      en {dias}d
                    </span>
                    <Link
                      href={`/admin/alumnos/${a.id}`}
                      title="Ver perfil"
                      className="flex items-center justify-center w-7 h-7 rounded-full bg-navy/5 hover:bg-navy/10 text-navy/50 hover:text-navy transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                      </svg>
                    </Link>
                    {waUrl ? (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Enviar mensaje por WhatsApp"
                        className="flex items-center justify-center w-7 h-7 rounded-full bg-green-50 hover:bg-green-100 text-green-600 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.554 4.123 1.522 5.862L.057 23.486a.75.75 0 00.918.938l5.86-1.517A11.953 11.953 0 0012 22.5c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.694-.525-5.222-1.438l-.374-.22-3.88 1.004 1.028-3.758-.242-.388A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                        </svg>
                      </a>
                    ) : (
                      <div className="w-7 h-7" />
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {(vencidos ?? []).length === 0 && (porVencer ?? []).length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm px-6 py-5">
          <p className="text-sm text-navy/40 font-body">Todo al día. No hay membresías vencidas ni por vencer esta semana.</p>
        </div>
      )}

      {/* Historial del mes */}
      <div className="bg-white rounded-2xl shadow-sm px-6 py-5">
        <p className="text-xs font-body font-semibold tracking-widest text-orange uppercase mb-3">
          Historial del mes
        </p>
        {!cobrosMes || cobrosMes.length === 0 ? (
          <p className="text-navy/40 font-body text-sm">Sin cobros registrados este mes.</p>
        ) : (
          <ul className="space-y-2">
            {cobrosMes.map((c) => {
              const anulado = c.estado === 'anulado'
              const alumnoNombre = nombreMap.get(c.alumno_id) ?? '—'
              return (
                <li key={c.id} className={`flex items-start justify-between gap-2 py-2 border-b border-gray-50 last:border-0 ${anulado ? 'opacity-50' : ''}`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/admin/alumnos/${c.alumno_id}`}
                        className="text-sm font-body font-medium text-navy hover:text-orange transition-colors"
                      >
                        {alumnoNombre}
                      </Link>
                      {anulado && (
                        <span className="text-xs font-body bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full">
                          Anulado
                        </span>
                      )}
                    </div>
                    {c.notas && (
                      <p className="text-xs text-navy/40 font-body">{c.notas}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <p className={`text-sm font-heading font-bold ${anulado ? 'line-through text-navy/40' : 'text-navy'}`}>
                      ${c.monto.toLocaleString('es-AR')}
                    </p>
                    <p className="text-xs text-navy/40 font-body tabular-nums">
                      {new Date(c.fecha + 'T00:00:00').toLocaleDateString('es-AR', {
                        day: '2-digit', month: '2-digit',
                      })}
                      {' · '}
                      {METODO_LABELS[c.metodo] ?? c.metodo}
                    </p>
                    {!anulado && (
                      <AnularCobroModal
                        cobroId={c.id}
                        monto={c.monto}
                        alumnoNombre={alumnoNombre}
                      />
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
