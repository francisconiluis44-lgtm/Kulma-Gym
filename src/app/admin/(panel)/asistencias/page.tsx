import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSession } from '@/lib/admin-auth'
import { getGymContext } from '@/lib/gym-context'
import { studentEmailDomain } from '@/lib/gym-context'
import { canUse, getRequiredPlanLabel } from '@/lib/plan-features'
import UpgradeGate from '@/components/UpgradeGate'
import Link from 'next/link'
import QrCode from './QrCode'
import ManualCheckin from './ManualCheckin'
import CalendarioAsistencias from './CalendarioAsistencias'

export const dynamic = 'force-dynamic'

export default async function AsistenciasPage() {
  const { gimnasioId, plan } = await getAdminSession()

  if (!canUse(plan, 'asistencias')) {
    return <UpgradeGate requiredPlan={getRequiredPlanLabel('asistencias')} />
  }
  const gym = await getGymContext()
  const adminSupabase = createAdminClient()

  const hoyAR = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
  const mes = hoyAR.slice(0, 7)

  const [mesYear, mesMonth] = mes.split('-').map(Number)
  const ultimoDiaMes = new Date(Date.UTC(mesYear, mesMonth, 0)).getUTCDate()
  const lastDay = `${mes}-${String(ultimoDiaMes).padStart(2, '0')}`

  const [
    { data: asistenciasHoy },
    { data: alumnos },
    { data: alumnosExternos },
    { data: asistenciasMes },
    { data: extHoy },
    { data: extMes },
  ] = await Promise.all([
    adminSupabase
      .from('asistencias')
      .select('id, checked_in_at, tipo, alumno_id')
      .eq('gimnasio_id', gimnasioId)
      .eq('fecha', hoyAR)
      .order('checked_in_at', { ascending: false }),
    adminSupabase
      .from('alumnos')
      .select('id, nombre_completo')
      .eq('gimnasio_id', gimnasioId)
      .order('nombre_completo'),
    adminSupabase
      .from('alumnos_externos')
      .select('id, nombre_completo')
      .eq('gimnasio_id', gimnasioId)
      .is('alumno_id', null)
      .order('nombre_completo'),
    adminSupabase
      .from('asistencias')
      .select('fecha')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha', `${mes}-01`)
      .lte('fecha', lastDay)
      .limit(50000),
    adminSupabase
      .from('asistencias_externas')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .select('id, alumno_externo_id, alumnos_externos(nombre_completo)' as any)
      .eq('gimnasio_id', gimnasioId)
      .eq('fecha', hoyAR),
    adminSupabase
      .from('asistencias_externas')
      .select('fecha')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha', `${mes}-01`)
      .lte('fecha', lastDay)
      .limit(50000),
  ])

  const alumnoMap = new Map((alumnos ?? []).map((a) => [a.id, a.nombre_completo]))

  function nombreExterno(row: unknown): string {
    const r = row as { alumnos_externos?: { nombre_completo?: string } | null }
    return r?.alumnos_externos?.nombre_completo ?? '—'
  }

  const diasConAsistencia: Record<string, number> = {}
  for (const a of asistenciasMes ?? []) {
    diasConAsistencia[a.fecha] = (diasConAsistencia[a.fecha] ?? 0) + 1
  }
  for (const a of extMes ?? []) {
    diasConAsistencia[a.fecha] = (diasConAsistencia[a.fecha] ?? 0) + 1
  }

  const registradosHoy = asistenciasHoy?.length ?? 0
  const importadosHoy = (extHoy as unknown[])?.length ?? 0
  const totalHoy = registradosHoy + importadosHoy

  const checkinUrl = `https://${studentEmailDomain(gym.slug)}/checkin`

  const fechaLabel = new Date().toLocaleDateString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-extrabold text-navy">Asistencias</h2>
          <p className="text-sm text-navy/50 font-body capitalize">{fechaLabel}</p>
        </div>
        <Link
          href="/admin/importar?tipo=asistencias"
          className="flex-shrink-0 px-4 py-2 rounded-xl border border-navy/20 text-navy text-sm font-heading font-bold hover:bg-navy/5 transition-colors"
        >
          Importar Excel
        </Link>
      </div>

      {/* QR Code */}
      <div className="bg-white rounded-2xl shadow-sm px-6 py-6">
        <p className="text-xs font-body font-semibold tracking-widest text-orange uppercase mb-4">
          Código QR del gimnasio
        </p>
        <p className="text-sm text-navy/60 font-body mb-4">
          Mostrale este QR a los alumnos para que registren su asistencia desde el celular.
        </p>
        <QrCode url={checkinUrl} />
      </div>

      {/* Manual check-in */}
      <div className="bg-white rounded-2xl shadow-sm px-6 py-6">
        <p className="text-xs font-body font-semibold tracking-widest text-orange uppercase mb-4">
          Registrar manualmente
        </p>
        <p className="text-sm text-navy/60 font-body mb-4">
          Para alumnos que no tienen el celular a mano.
        </p>
        <ManualCheckin alumnos={alumnos ?? []} externos={alumnosExternos ?? []} />
      </div>

      {/* Today's attendance */}
      <div className="bg-white rounded-2xl shadow-sm px-6 py-6">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-body font-semibold tracking-widest text-orange uppercase">
            Presentes hoy
          </p>
          <span className="text-2xl font-heading font-extrabold text-navy">
            {totalHoy}
          </span>
        </div>
        <div className="mb-4">
          {importadosHoy > 0 && (
            <p className="text-xs font-body text-navy/40">
              {registradosHoy} registrados · {importadosHoy} importados
            </p>
          )}
        </div>

        {totalHoy === 0 ? (
          <p className="text-navy/40 font-body text-sm">Nadie registró asistencia todavía.</p>
        ) : (
          <ul className="space-y-2">
            {(asistenciasHoy ?? []).map((a) => {
              const nombre = alumnoMap.get(a.alumno_id) ?? '—'
              const hora = new Date(a.checked_in_at).toLocaleTimeString('es-AR', {
                timeZone: 'America/Argentina/Buenos_Aires',
                hour: '2-digit',
                minute: '2-digit',
              })
              return (
                <li key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="font-body text-sm text-navy">{nombre}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-navy/40 font-body tabular-nums">{hora} hs</span>
                    {a.tipo === 'admin' && (
                      <span className="text-xs font-body bg-navy/10 text-navy/60 px-2 py-0.5 rounded-full">
                        manual
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
            {(extHoy as unknown[] ?? []).map((row, i) => (
              <li key={`ext-${i}`} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="font-body text-sm text-navy">{nombreExterno(row)}</span>
                <span className="text-xs font-body bg-navy/10 text-navy/60 px-2 py-0.5 rounded-full">
                  importado
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Historial */}
      <div>
        <p className="text-xs font-body font-semibold tracking-widest text-navy/50 uppercase mb-3">
          Historial
        </p>
        <CalendarioAsistencias
          mes={mes}
          diasConAsistencia={diasConAsistencia}
        />
      </div>
    </div>
  )
}
