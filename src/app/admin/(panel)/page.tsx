import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

const MESES_CORTOS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function pctChange(curr: number, prev: number): number | null {
  if (prev === 0) return null
  return Math.round(((curr - prev) / prev) * 100)
}

function buildWaUrl(phone: string, gymName: string, nombre: string): string {
  const digits = phone.replace(/\D/g, '')
  const norm = digits.startsWith('0') ? digits.slice(1) : digits
  const p = norm.startsWith('54') ? norm : `54${norm}`
  const firstName = nombre.split(' ')[0]
  const texto = `Hola ${firstName}! 👋 Te escribimos desde ${gymName}.\nHace un tiempo que no te vemos por el gym... ¿Todo bien? 💪 ¡Te esperamos!\n_(Mensaje automático)_`
  return `https://wa.me/${p}?text=${encodeURIComponent(texto)}`
}

function IngresoTile({
  label, value, sub, subColor = 'gray',
}: { label: string; value: string; sub?: string; subColor?: 'gray' | 'green' | 'red' }) {
  const subCn = subColor === 'green' ? 'text-green-600' : subColor === 'red' ? 'text-red-500' : 'text-navy/40'
  return (
    <div className="bg-white rounded-2xl shadow-sm px-5 py-5 flex flex-col gap-1 min-w-0">
      <p className="text-xs font-body font-semibold tracking-widest text-navy/40 uppercase truncate">{label}</p>
      <p className="text-2xl font-heading font-extrabold text-navy leading-none">{value}</p>
      {sub && <p className={`text-xs font-body ${subCn}`}>{sub}</p>}
    </div>
  )
}

function MiniBar({ bars, color = '#FF6B2B' }: { bars: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...bars.map(b => b.value), 1)
  return (
    <div className="flex items-end gap-[3px] h-14 w-full">
      {bars.map(b => (
        <div key={b.label} className="flex-1 flex flex-col items-center gap-0.5">
          <div
            className="w-full rounded-t-[3px]"
            style={{
              height: `${Math.max((b.value / max) * 100, b.value > 0 ? 4 : 0)}%`,
              backgroundColor: b.value > 0 ? color : '#e5e7eb',
            }}
          />
          <span className="text-navy/30 font-body" style={{ fontSize: '9px' }}>{b.label}</span>
        </div>
      ))}
    </div>
  )
}

export default async function DashboardPage() {
  const { gimnasioId } = await getAdminSession()
  const supabase = createAdminClient()

  // ─── Fechas ───────────────────────────────────────────
  const hoyAR = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
  const hoy = new Date(hoyAR + 'T00:00:00')
  const en7diasStr = addDays(hoyAR, 7)
  const hace10diasStr = addDays(hoyAR, -10)
  const hace20diasStr = addDays(hoyAR, -20)
  const hace180diasStr = addDays(hoyAR, -180)

  const anio = parseInt(hoyAR.slice(0, 4))
  const mes = parseInt(hoyAR.slice(5, 7))
  const diaDelMes = parseInt(hoyAR.slice(8, 10))
  const primerDiaMes = `${anio}-${String(mes).padStart(2, '0')}-01`

  const mesAnt = mes === 1 ? 12 : mes - 1
  const anioAnt = mes === 1 ? anio - 1 : anio
  const primerDiaMesAnt = `${anioAnt}-${String(mesAnt).padStart(2, '0')}-01`
  const diasMesAnt = new Date(anio, mes - 1, 0).getDate() // días del mes anterior

  // ─── Queries paralelas ────────────────────────────────
  const [
    { count: alumnosActivos },
    { count: totalAlumnos },
    { count: nuevosEsteMes },
    { count: nuevosAntMes },
    { count: porVencer7 },
    { count: vencidos },
    { count: rutinasPorVencer },
    { data: cobrosMes },
    { data: cobrosAnt },
    { data: asistenciasMes },
    { count: asistenciasAntTotal },
    { data: alumnosConMemb },
    { data: asistInactivos },
    { data: cobros6m },
    { data: gimnasio },
    { data: ultimoComunicado },
  ] = await Promise.all([
    supabase.from('alumnos').select('*', { count: 'exact', head: true })
      .eq('gimnasio_id', gimnasioId).gte('fecha_vencimiento', hoyAR),

    supabase.from('alumnos').select('*', { count: 'exact', head: true })
      .eq('gimnasio_id', gimnasioId),

    supabase.from('alumnos').select('*', { count: 'exact', head: true })
      .eq('gimnasio_id', gimnasioId).gte('fecha_alta', primerDiaMes),

    supabase.from('alumnos').select('*', { count: 'exact', head: true })
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha_alta', primerDiaMesAnt).lt('fecha_alta', primerDiaMes),

    supabase.from('alumnos').select('*', { count: 'exact', head: true })
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha_vencimiento', hoyAR).lte('fecha_vencimiento', en7diasStr),

    supabase.from('alumnos').select('*', { count: 'exact', head: true })
      .eq('gimnasio_id', gimnasioId)
      .not('fecha_vencimiento', 'is', null).lt('fecha_vencimiento', hoyAR),

    supabase.from('alumnos').select('*', { count: 'exact', head: true })
      .eq('gimnasio_id', gimnasioId)
      .not('rutina_fecha_vencimiento', 'is', null)
      .lte('rutina_fecha_vencimiento', en7diasStr),

    supabase.from('cobros').select('monto, alumno_id')
      .eq('gimnasio_id', gimnasioId).gte('fecha', primerDiaMes),

    supabase.from('cobros').select('monto')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha', primerDiaMesAnt).lt('fecha', primerDiaMes),

    supabase.from('asistencias').select('checked_in_at, fecha')
      .eq('gimnasio_id', gimnasioId).gte('fecha', primerDiaMes),

    supabase.from('asistencias').select('*', { count: 'exact', head: true })
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha', primerDiaMesAnt).lt('fecha', primerDiaMes),

    supabase.from('alumnos').select('id, nombre_completo, whatsapp')
      .eq('gimnasio_id', gimnasioId).gte('fecha_vencimiento', hoyAR),

    supabase.from('asistencias').select('alumno_id, fecha')
      .eq('gimnasio_id', gimnasioId).gte('fecha', hace20diasStr),

    supabase.from('cobros').select('monto, fecha')
      .eq('gimnasio_id', gimnasioId).gte('fecha', hace180diasStr),

    supabase.from('gimnasios').select('nombre').eq('id', gimnasioId).single(),

    supabase.from('comunicados').select('titulo, created_at')
      .eq('gimnasio_id', gimnasioId)
      .order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  // ─── Cálculos ─────────────────────────────────────────
  const gymName = gimnasio?.nombre ?? 'el gimnasio'

  const totalMes = (cobrosMes ?? []).reduce((s, c) => s + Number(c.monto), 0)
  const totalAnt = (cobrosAnt ?? []).reduce((s, c) => s + Number(c.monto), 0)
  const pctIngresos = pctChange(totalMes, totalAnt)
  const renovacionesMes = new Set((cobrosMes ?? []).map(c => c.alumno_id)).size

  const asistenciasHoyCount = (asistenciasMes ?? []).filter(a => a.fecha === hoyAR).length
  const promedioDiario = diaDelMes > 0 ? Math.round((asistenciasMes?.length ?? 0) / diaDelMes) : 0
  const promedioAnt = diasMesAnt > 0 ? Math.round((asistenciasAntTotal ?? 0) / diasMesAnt) : 0
  const pctAsist = pctChange(promedioDiario, promedioAnt)

  // Inactivos: activos sin asistencia en 10 días
  const ids10d = new Set((asistInactivos ?? []).filter(a => a.fecha >= hace10diasStr).map(a => a.alumno_id))
  const ids20d = new Set((asistInactivos ?? []).map(a => a.alumno_id))
  const inactivos20plus = (alumnosConMemb ?? []).filter(a => !ids20d.has(a.id))
  const inactivos10a20 = (alumnosConMemb ?? []).filter(a => !ids10d.has(a.id) && ids20d.has(a.id))
  const todosInactivos = [...inactivos20plus, ...inactivos10a20]

  // Horario pico (mes actual)
  const porHora = Array<number>(24).fill(0)
  for (const a of (asistenciasMes ?? [])) {
    const utcH = new Date(a.checked_in_at).getUTCHours()
    const localH = (utcH - 3 + 24) % 24
    porHora[localH]++
  }
  const horasBars = Array.from({ length: 17 }, (_, i) => ({
    label: String(i + 6).padStart(2, '0'),
    value: porHora[i + 6],
  }))

  // Ingresos por mes (últimos 6)
  const ingresosPorMes: Record<string, number> = {}
  for (const c of (cobros6m ?? [])) {
    const k = c.fecha.slice(0, 7)
    ingresosPorMes[k] = (ingresosPorMes[k] ?? 0) + Number(c.monto)
  }
  const meses6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(hoy)
    d.setMonth(d.getMonth() - (5 - i))
    return d.toISOString().slice(0, 7)
  })
  const ingresosBars = meses6.map(m => ({
    label: MESES_CORTOS[parseInt(m.slice(5, 7)) - 1],
    value: ingresosPorMes[m] ?? 0,
  }))

  // Semáforo
  const activosRatio = (totalAlumnos ?? 0) > 0 ? (alumnosActivos ?? 0) / (totalAlumnos ?? 1) : 0
  const inactivosRatio = (alumnosActivos ?? 0) > 0 ? todosInactivos.length / (alumnosActivos ?? 1) : 0
  let semaforo: 'excelente' | 'bueno' | 'atencion'
  let semaforoMsg: string
  if (activosRatio >= 0.45 && inactivosRatio < 0.25) {
    semaforo = 'excelente'
    semaforoMsg = pctIngresos !== null && pctIngresos > 0
      ? `Los ingresos subieron un ${pctIngresos}% respecto al mes pasado.`
      : `La asistencia es regular y las membresías están al día.`
  } else if (activosRatio >= 0.3 || inactivosRatio < 0.4) {
    semaforo = 'bueno'
    semaforoMsg = (vencidos ?? 0) > 5
      ? `Hay ${vencidos} alumnos con cuota vencida. Buen momento para contactarlos.`
      : `${todosInactivos.length} alumnos no vinieron en los últimos 10 días.`
  } else {
    semaforo = 'atencion'
    semaforoMsg = `Varios alumnos inactivos y cuotas vencidas. Revisá cobros.`
  }

  const semaforoConfig = {
    excelente: { icon: '🟢', label: 'Excelente', cn: 'bg-green-50 border-green-200 text-green-800' },
    bueno:     { icon: '🟡', label: 'Bueno',     cn: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
    atencion:  { icon: '🔴', label: 'Atención',  cn: 'bg-red-50 border-red-200 text-red-800' },
  }[semaforo]

  // Próximas tareas
  const tareas: { icon: string; text: string; href: string; count: number }[] = []
  if ((vencidos ?? 0) > 0)
    tareas.push({ icon: '💰', text: `cuota${(vencidos ?? 0) !== 1 ? 's' : ''} vencida${(vencidos ?? 0) !== 1 ? 's' : ''}`, href: '/admin/cobros', count: vencidos ?? 0 })
  if ((porVencer7 ?? 0) > 0)
    tareas.push({ icon: '⏰', text: `por vencer esta semana`, href: '/admin/cobros', count: porVencer7 ?? 0 })
  if (todosInactivos.length > 0)
    tareas.push({ icon: '📞', text: `inactivo${todosInactivos.length !== 1 ? 's' : ''} para contactar`, href: '#inactivos', count: todosInactivos.length })
  if ((rutinasPorVencer ?? 0) > 0)
    tareas.push({ icon: '📋', text: `rutina${(rutinasPorVencer ?? 0) !== 1 ? 's' : ''} por renovar`, href: '/admin/alumnos', count: rutinasPorVencer ?? 0 })

  return (
    <div className="space-y-6 pb-8">

      {/* Semáforo */}
      <div className={`rounded-2xl border px-5 py-4 ${semaforoConfig.cn}`}>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-lg">{semaforoConfig.icon}</span>
          <span className="font-heading font-bold text-base">{semaforoConfig.label}</span>
        </div>
        <p className="text-sm font-body">{semaforoMsg}</p>
      </div>

      {/* Próximas tareas */}
      {tareas.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm px-5 py-4">
          <p className="text-xs font-body font-semibold tracking-widest text-navy/40 uppercase mb-3">
            Para hoy
          </p>
          <div className="flex flex-wrap gap-2">
            {tareas.map((t) => (
              <Link
                key={t.text}
                href={t.href}
                className="flex items-center gap-2 px-3 py-2 bg-navy/5 hover:bg-navy/10 rounded-xl transition-colors"
              >
                <span className="text-base leading-none">{t.icon}</span>
                <span className="text-sm font-body text-navy">
                  <span className="font-bold">{t.count}</span> {t.text}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Row 1: tiles principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <IngresoTile
          label="Alumnos activos"
          value={String(alumnosActivos ?? 0)}
          sub={
            (nuevosEsteMes ?? 0) > 0
              ? `+${nuevosEsteMes} nuevos este mes`
              : `de ${totalAlumnos ?? 0} totales`
          }
          subColor={(nuevosEsteMes ?? 0) > 0 ? 'green' : 'gray'}
        />
        <IngresoTile
          label="Ingresos del mes"
          value={`$${totalMes.toLocaleString('es-AR')}`}
          sub={
            pctIngresos !== null
              ? `${pctIngresos >= 0 ? '↑' : '↓'} ${Math.abs(pctIngresos)}% vs mes pasado`
              : totalAnt === 0 ? 'Sin cobros el mes pasado' : undefined
          }
          subColor={pctIngresos !== null ? (pctIngresos >= 0 ? 'green' : 'red') : 'gray'}
        />
        <IngresoTile
          label="Por vencer (7d)"
          value={String(porVencer7 ?? 0)}
          sub={(porVencer7 ?? 0) > 0 ? 'membresías próximas' : 'Todo al día'}
          subColor={(porVencer7 ?? 0) > 0 ? 'red' : 'green'}
        />
        <IngresoTile
          label="Cuotas vencidas"
          value={String(vencidos ?? 0)}
          sub={(vencidos ?? 0) > 0 ? 'Cobrar cuanto antes' : 'Sin vencidas'}
          subColor={(vencidos ?? 0) > 0 ? 'red' : 'green'}
        />
      </div>

      {/* Row 2: tiles secundarias */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <IngresoTile
          label="Asistencias hoy"
          value={String(asistenciasHoyCount)}
          sub={`Prom. diario: ${promedioDiario}/día`}
          subColor="gray"
        />
        <IngresoTile
          label="Promedio diario"
          value={`${promedioDiario}/día`}
          sub={
            pctAsist !== null
              ? `${pctAsist >= 0 ? '↑' : '↓'} ${Math.abs(pctAsist)}% vs mes pasado`
              : undefined
          }
          subColor={pctAsist !== null ? (pctAsist >= 0 ? 'green' : 'red') : 'gray'}
        />
        <IngresoTile
          label="Nuevos este mes"
          value={String(nuevosEsteMes ?? 0)}
          sub={
            (nuevosAntMes ?? 0) > 0
              ? `${(nuevosEsteMes ?? 0) >= (nuevosAntMes ?? 0) ? '↑' : '↓'} vs ${nuevosAntMes} el mes pasado`
              : undefined
          }
          subColor={
            (nuevosAntMes ?? 0) > 0
              ? (nuevosEsteMes ?? 0) >= (nuevosAntMes ?? 0) ? 'green' : 'red'
              : 'gray'
          }
        />
        <IngresoTile
          label="Renovaciones"
          value={String(renovacionesMes)}
          sub="alumnos pagaron este mes"
          subColor="gray"
        />
      </div>

      {/* Último comunicado */}
      {ultimoComunicado && (
        <div className="bg-white rounded-2xl shadow-sm px-5 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-body font-semibold tracking-widest text-navy/40 uppercase mb-0.5">
              Último comunicado
            </p>
            <p className="text-sm font-body font-medium text-navy truncate">
              {ultimoComunicado.titulo}
            </p>
          </div>
          <Link href="/admin/comunicados" className="shrink-0 text-xs font-semibold text-orange hover:underline font-body">
            Ver →
          </Link>
        </div>
      )}

      {/* Inactivos */}
      <div id="inactivos" className="bg-white rounded-2xl shadow-sm px-5 py-5">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <p className="text-xs font-body font-semibold tracking-widest text-navy/40 uppercase">
              Inactivos
            </p>
            <p className="text-sm font-body text-navy mt-0.5">
              {todosInactivos.length === 0
                ? 'Ningún alumno inactivo esta semana.'
                : (
                  <>
                    <span className="font-bold text-navy">{todosInactivos.length}</span>
                    {' alumnos sin venir hace más de 10 días'}
                    {inactivos20plus.length > 0 && (
                      <span className="text-red-500 ml-1">({inactivos20plus.length} hace más de 20 días)</span>
                    )}
                  </>
                )}
            </p>
          </div>
        </div>

        {todosInactivos.length === 0 ? (
          <p className="text-sm text-green-600 font-body">✓ Todos vinieron en los últimos 10 días.</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {todosInactivos.map((a) => {
              const esMasde20 = inactivos20plus.some(i => i.id === a.id)
              const waUrl = a.whatsapp ? buildWaUrl(a.whatsapp, gymName, a.nombre_completo) : null
              return (
                <li key={a.id} className="flex items-center justify-between py-2.5 gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {esMasde20 && (
                      <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" title="Más de 20 días" />
                    )}
                    <Link
                      href={`/admin/alumnos/${a.id}`}
                      className="text-sm font-body text-navy hover:text-orange transition-colors truncate"
                    >
                      {a.nombre_completo}
                    </Link>
                  </div>
                  {waUrl ? (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold font-body rounded-lg transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.554 4.123 1.522 5.862L.057 23.486a.75.75 0 00.918.938l5.86-1.517A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.694-.525-5.222-1.438l-.374-.22-3.88 1.004 1.028-3.758-.242-.388A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                      </svg>
                      WA
                    </a>
                  ) : (
                    <span className="text-xs text-navy/30 font-body shrink-0">Sin tel.</span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Evolución de ingresos */}
        <div className="bg-white rounded-2xl shadow-sm px-5 py-5">
          <p className="text-xs font-body font-semibold tracking-widest text-navy/40 uppercase mb-1">
            Ingresos por mes
          </p>
          <p className="text-2xl font-heading font-extrabold text-navy mb-4">
            ${Math.max(...ingresosBars.map(b => b.value)).toLocaleString('es-AR')}
          </p>
          <MiniBar bars={ingresosBars} color="#FF6B2B" />
        </div>

        {/* Horario pico */}
        <div className="bg-white rounded-2xl shadow-sm px-5 py-5">
          <p className="text-xs font-body font-semibold tracking-widest text-navy/40 uppercase mb-1">
            Horario pico (mes actual)
          </p>
          {(() => {
            const picoIdx = porHora.indexOf(Math.max(...porHora))
            return (
              <p className="text-2xl font-heading font-extrabold text-navy mb-4">
                {String(picoIdx).padStart(2,'0')}:00 – {String(picoIdx + 1).padStart(2,'0')}:00
              </p>
            )
          })()}
          <MiniBar bars={horasBars} color="#1B2A4A" />
        </div>

      </div>

    </div>
  )
}
