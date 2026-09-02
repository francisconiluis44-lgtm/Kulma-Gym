import type { ReactNode } from 'react'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSession } from '@/lib/admin-auth'
import { canUse } from '@/lib/plan-features'
import RegistrarContactoModal from '@/components/admin/RegistrarContactoModal'

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

function diasDesde(fechaStr: string | undefined, hoy: Date): string {
  if (!fechaStr) return 'nunca'
  const dias = Math.floor((hoy.getTime() - new Date(fechaStr + 'T00:00:00').getTime()) / 86400000)
  if (dias === 0) return 'hoy'
  if (dias === 1) return 'ayer'
  return `hace ${dias} días`
}

function buildWaUrl(phone: string, gymName: string, nombre: string): string {
  const digits = phone.replace(/\D/g, '')
  const norm = digits.startsWith('0') ? digits.slice(1) : digits
  const p = norm.startsWith('54') ? norm : `54${norm}`
  const firstName = nombre.split(' ')[0]
  const texto = `Hola ${firstName}! 👋 Te escribimos desde ${gymName}.\nHace un tiempo que no te vemos por el gym... ¿Todo bien? 💪 ¡Te esperamos!\n_(Mensaje automático)_`
  return `https://wa.me/${p}?text=${encodeURIComponent(texto)}`
}

type TileColor = 'blue' | 'green' | 'orange' | 'red' | 'sky'
type SubColor  = 'gray' | 'green' | 'red' | 'orange'

const VALUE_COLOR: Record<TileColor, string> = {
  blue:   'text-blue-600',
  green:  'text-emerald-600',
  orange: 'text-orange',
  red:    'text-red-500',
  sky:    'text-sky-500',
}
const TILE_BORDER: Record<TileColor, string> = {
  blue:   'border-t-[3px] border-blue-300/70',
  green:  'border-t-[3px] border-emerald-300/70',
  orange: 'border-t-[3px] border-orange/50',
  red:    'border-t-[3px] border-red-300/70',
  sky:    'border-t-[3px] border-sky-300/70',
}
const ICON_BG: Record<TileColor, string> = {
  blue:   'bg-blue-50 text-blue-500',
  green:  'bg-emerald-50 text-emerald-600',
  orange: 'bg-orange/10 text-orange',
  red:    'bg-red-50 text-red-500',
  sky:    'bg-sky-50 text-sky-500',
}
const SUB_COLOR: Record<SubColor, string> = {
  gray:   'text-navy/40',
  green:  'text-emerald-600',
  red:    'text-red-500',
  orange: 'text-orange',
}

function Tile({
  label, value, sub, subColor = 'gray', color, href, cta, icon,
}: {
  label: string
  value: string
  sub?: string
  subColor?: SubColor
  color?: TileColor
  href?: string
  cta?: string
  icon?: React.ReactNode
}) {
  const valueCn  = color ? VALUE_COLOR[color] : 'text-navy'
  const borderCn = color ? TILE_BORDER[color] : ''
  const iconBgCn = color ? ICON_BG[color] : ''
  const subCn    = SUB_COLOR[subColor]
  const inner = (
    <div
      className={`bg-white rounded-2xl shadow-sm px-5 py-5 flex flex-col gap-2 min-w-0 h-full select-none ${borderCn}
        ${href ? 'hover:shadow-md hover:-translate-y-px transition-all duration-150 active:scale-[0.97] active:shadow-none' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-body font-semibold tracking-widest text-navy/40 uppercase flex-1 leading-tight">
          {label}
        </p>
        {icon && color && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBgCn}`}>
            {icon}
          </div>
        )}
      </div>
      <p className={`text-[1.9rem] font-heading font-extrabold leading-none ${valueCn}`}>
        {value}
      </p>
      {sub && <p className={`text-xs font-body leading-snug ${subCn}`}>{sub}</p>}
      {cta && href && (
        <p className="text-[11px] font-body text-navy/30 mt-auto pt-1">
          {cta} →
        </p>
      )}
    </div>
  )
  if (href) return <Link href={href} className="block h-full">{inner}</Link>
  return inner
}

function MiniBar({ bars, color }: { bars: { label: string; value: number }[]; color: string }) {
  const max = Math.max(...bars.map(b => b.value), 1)
  return (
    <div className="flex items-end gap-[3px] h-14 w-full">
      {bars.map(b => (
        <div key={b.label} className="flex-1 flex flex-col items-center gap-0.5">
          <div
            className="w-full rounded-t-[3px]"
            style={{
              height: `${Math.max((b.value / max) * 100, b.value > 0 ? 5 : 0)}%`,
              backgroundColor: b.value > 0 ? color : '#e5e7eb',
            }}
          />
          <span className="text-navy/30 font-body" style={{ fontSize: '9px' }}>{b.label}</span>
        </div>
      ))}
    </div>
  )
}

const WaIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.554 4.123 1.522 5.862L.057 23.486a.75.75 0 00.918.938l5.86-1.517A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.694-.525-5.222-1.438l-.374-.22-3.88 1.004 1.028-3.758-.242-.388A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
  </svg>
)

const sw = { strokeWidth: 1.8 }
const ICONS: Record<string, ReactNode> = {
  users: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...sw}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  cash: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...sw}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  clock: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...sw}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  warning: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...sw}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  check: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...sw}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  userPlus: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...sw}><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>,
  refresh: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...sw}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  clipboard: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...sw}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
}

export default async function DashboardPage() {
  const { gimnasioId, plan, rol } = await getAdminSession()
  const esOwner = rol === 'owner'
  const supabase = createAdminClient()

  const isPro      = canUse(plan, 'asistencias')
  const isPremium  = canUse(plan, 'dashboard_ejecutivo')

  // ─── Fechas ───────────────────────────────────────────
  const hoyAR = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
  const hoy   = new Date(hoyAR + 'T00:00:00')
  const en7d  = addDays(hoyAR, 7)

  const anio        = parseInt(hoyAR.slice(0, 4))
  const mes         = parseInt(hoyAR.slice(5, 7))
  const diaDelMes   = parseInt(hoyAR.slice(8, 10))
  const primerDiaMes = `${anio}-${String(mes).padStart(2, '0')}-01`

  const mesAnt          = mes === 1 ? 12 : mes - 1
  const anioAnt         = mes === 1 ? anio - 1 : anio
  const primerDiaMesAnt = `${anioAnt}-${String(mesAnt).padStart(2, '0')}-01`
  const diasMesAnt      = new Date(anio, mes - 1, 0).getDate()

  const hace10d  = addDays(hoyAR, -10)
  const hace20d  = addDays(hoyAR, -20)
  const hace90d  = addDays(hoyAR, -90)
  const hace180d = addDays(hoyAR, -180)

  // ─── Queries base (todos los planes) ─────────────────
  const [
    { count: alumnosActivos },
    { count: totalAlumnos },
    { count: nuevosEsteMes },
    { count: porVencer7 },
    { count: vencidos },
    { count: rutinasPorVencer },
    { data: cobrosMes },
    { data: gimnasio },
    { data: cobrosExtMesDash },
    { data: ultimoComunicado },
  ] = await Promise.all([
    supabase.from('alumnos').select('*', { count: 'exact', head: true })
      .eq('gimnasio_id', gimnasioId).eq('archivado', false).gte('fecha_vencimiento', hoyAR),
    supabase.from('alumnos').select('*', { count: 'exact', head: true })
      .eq('gimnasio_id', gimnasioId).eq('archivado', false),
    supabase.from('alumnos').select('*', { count: 'exact', head: true })
      .eq('gimnasio_id', gimnasioId).eq('archivado', false).gte('fecha_alta', primerDiaMes),
    supabase.from('alumnos').select('*', { count: 'exact', head: true })
      .eq('gimnasio_id', gimnasioId).eq('archivado', false)
      .gte('fecha_vencimiento', hoyAR).lte('fecha_vencimiento', en7d),
    supabase.from('alumnos').select('*', { count: 'exact', head: true })
      .eq('gimnasio_id', gimnasioId).eq('archivado', false)
      .not('fecha_vencimiento', 'is', null).lt('fecha_vencimiento', hoyAR),
    supabase.from('alumnos').select('*', { count: 'exact', head: true })
      .eq('gimnasio_id', gimnasioId).eq('archivado', false)
      .not('rutina_fecha_vencimiento', 'is', null)
      .gte('rutina_fecha_vencimiento', hoyAR)
      .lte('rutina_fecha_vencimiento', en7d),
    esOwner
      ? supabase.from('cobros').select('monto, alumno_id').eq('gimnasio_id', gimnasioId).gte('fecha', primerDiaMes)
      : Promise.resolve({ data: [] as { monto: number; alumno_id: string }[], error: null }),
    supabase.from('gimnasios').select('nombre').eq('id', gimnasioId).single(),
    esOwner
      ? supabase.from('cobros_externos').select('monto').eq('gimnasio_id', gimnasioId).gte('fecha', primerDiaMes)
      : Promise.resolve({ data: [] as { monto: number }[], error: null }),
    supabase.from('comunicados').select('titulo, created_at')
      .eq('gimnasio_id', gimnasioId)
      .order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  const gymName  = gimnasio?.nombre ?? 'el gimnasio'
  const totalMesReg = (cobrosMes ?? []).reduce((s, c) => s + Number(c.monto), 0)
  const totalMesExt = (cobrosExtMesDash ?? []).reduce((s, c) => s + Number(c.monto), 0)
  const totalMes = totalMesReg + totalMesExt
  const renovaciones = new Set((cobrosMes ?? []).map(c => c.alumno_id)).size

  // ─── Queries Pro (asistencias + comparaciones) ────────
  let nuevosAntMes        = 0
  let cobrosAnt:          { monto: number }[] = []
  let asistenciasMesCount = 0
  let asistenciasHoyCount = 0
  let diasConAsistencia   = 0
  let asistenciasMes:     { checked_in_at: string }[] = []
  let asistenciasAntTotal = 0
  let alumnosConMemb:     { id: string; nombre_completo: string; whatsapp: string | null }[] = []
  let asist20dData:       { alumno_id: string; fecha: string }[] = []
  let retornantes    = 0
  let nuevosExternos = 0
  let totalNuevos    = nuevosEsteMes ?? 0

  if (isPro) {
    const [
      { count: _nuevosAntMes },
      { data: _cobrosAnt },
      { count: _asistMesCount },
      { count: _asistHoyCount },
      { count: _asistAntCount },
      { data: _alumnosConMemb },
      { data: _asist20dData },
      { data: _regFechasMes },
      { count: _extMesCount },
      { count: _extHoyCount },
      { count: _extAntCount },
      { data: _extFechasMes },
    ] = await Promise.all([
      supabase.from('alumnos').select('*', { count: 'exact', head: true })
        .eq('gimnasio_id', gimnasioId).eq('archivado', false)
        .gte('fecha_alta', primerDiaMesAnt).lt('fecha_alta', primerDiaMes),
      esOwner
        ? supabase.from('cobros').select('monto').eq('gimnasio_id', gimnasioId).gte('fecha', primerDiaMesAnt).lt('fecha', primerDiaMes)
        : Promise.resolve({ data: [] as { monto: number }[], error: null }),
      supabase.from('asistencias').select('*', { count: 'exact', head: true })
        .eq('gimnasio_id', gimnasioId).gte('fecha', primerDiaMes),
      supabase.from('asistencias').select('*', { count: 'exact', head: true })
        .eq('gimnasio_id', gimnasioId).eq('fecha', hoyAR),
      supabase.from('asistencias').select('*', { count: 'exact', head: true })
        .eq('gimnasio_id', gimnasioId)
        .gte('fecha', primerDiaMesAnt).lt('fecha', primerDiaMes),
      supabase.from('alumnos').select('id, nombre_completo, whatsapp')
        .eq('gimnasio_id', gimnasioId).eq('archivado', false).gte('fecha_vencimiento', hoyAR),
      supabase.from('asistencias').select('alumno_id, fecha')
        .eq('gimnasio_id', gimnasioId).gte('fecha', hace20d)
        .order('fecha', { ascending: false }).limit(5000),
      // Fechas únicas de registrados este mes (para diasConAsistencia)
      supabase.from('asistencias').select('fecha')
        .eq('gimnasio_id', gimnasioId).gte('fecha', primerDiaMes).limit(50000),
      // Conteos de externos
      supabase.from('asistencias_externas').select('*', { count: 'exact', head: true })
        .eq('gimnasio_id', gimnasioId).gte('fecha', primerDiaMes),
      supabase.from('asistencias_externas').select('*', { count: 'exact', head: true })
        .eq('gimnasio_id', gimnasioId).eq('fecha', hoyAR),
      supabase.from('asistencias_externas').select('*', { count: 'exact', head: true })
        .eq('gimnasio_id', gimnasioId)
        .gte('fecha', primerDiaMesAnt).lt('fecha', primerDiaMes),
      // Fechas únicas de externos este mes (para diasConAsistencia)
      supabase.from('asistencias_externas').select('fecha')
        .eq('gimnasio_id', gimnasioId).gte('fecha', primerDiaMes).limit(50000),
    ])
    const diasSet = new Set([
      ...(_regFechasMes ?? []).map(a => a.fecha as string),
      ...(_extFechasMes ?? []).map(a => a.fecha as string),
    ])
    nuevosAntMes        = _nuevosAntMes ?? 0
    cobrosAnt           = _cobrosAnt ?? []
    asistenciasMesCount = (_asistMesCount ?? 0) + (_extMesCount ?? 0)
    asistenciasHoyCount = (_asistHoyCount ?? 0) + (_extHoyCount ?? 0)
    asistenciasAntTotal = (_asistAntCount ?? 0) + (_extAntCount ?? 0)
    alumnosConMemb      = _alumnosConMemb ?? []
    asist20dData        = _asist20dData ?? []
    diasConAsistencia   = diasSet.size

    // ─── Retornantes y externos nuevos ───────────────────
    const hace60dMes = addDays(primerDiaMes, -60)
    const hace2y     = addDays(primerDiaMes, -730)
    const [
      { data: _gnIds },
      { data: _asMes },
      { data: _asPrev60 },
      { data: _extMes },
      { data: _extPrev },
    ] = await Promise.all([
      // IDs de alumnos con cuenta que se dieron de alta este mes
      supabase.from('alumnos').select('id')
        .eq('gimnasio_id', gimnasioId).eq('archivado', false).gte('fecha_alta', primerDiaMes),
      // Alumnos con cuenta que asistieron este mes
      supabase.from('asistencias').select('alumno_id')
        .eq('gimnasio_id', gimnasioId).gte('fecha', primerDiaMes).limit(10000),
      // Alumnos con cuenta que asistieron en los 60 días previos al mes
      supabase.from('asistencias').select('alumno_id')
        .eq('gimnasio_id', gimnasioId).gte('fecha', hace60dMes).lt('fecha', primerDiaMes).limit(10000),
      // Alumnos externos que asistieron este mes
      supabase.from('asistencias_externas').select('alumno_externo_id')
        .eq('gimnasio_id', gimnasioId).gte('fecha', primerDiaMes).limit(5000),
      // Alumnos externos que asistieron antes de este mes (últimos 2 años)
      supabase.from('asistencias_externas').select('alumno_externo_id')
        .eq('gimnasio_id', gimnasioId).gte('fecha', hace2y).lt('fecha', primerDiaMes).limit(5000),
    ])
    const gnSet  = new Set((_gnIds    ?? []).map(a => a.id))
    const mSet   = new Set((_asMes    ?? []).map(a => a.alumno_id))
    const p60Set = new Set((_asPrev60 ?? []).map(a => a.alumno_id))
    const emSet  = new Set((_extMes   ?? []).map(a => a.alumno_externo_id))
    const epSet  = new Set((_extPrev  ?? []).map(a => a.alumno_externo_id))
    // Retornante: asistió este mes, sin asistencia en los 60 días previos, no es alumno nuevo con cuenta
    retornantes    = [...mSet].filter(id => !p60Set.has(id) && !gnSet.has(id)).length
    // Externo nuevo: asistió este mes, nunca había asistido antes de este mes
    nuevosExternos = [...emSet].filter(id => !epSet.has(id)).length
    totalNuevos    = (nuevosEsteMes ?? 0) + retornantes + nuevosExternos
  }

  // ─── Queries Premium (gráficos) ───────────────────────
  let cobros6m: { monto: number; fecha: string }[] = []
  if (isPremium) {
    const [
      { data: _cobros6m },
      { data: _asistMesPorHora },
    ] = await Promise.all([
      esOwner
        ? supabase.from('cobros').select('monto, fecha').eq('gimnasio_id', gimnasioId).gte('fecha', hace180d)
        : Promise.resolve({ data: [] as { monto: number; fecha: string }[], error: null }),
      supabase.from('asistencias').select('checked_in_at')
        .eq('gimnasio_id', gimnasioId).gte('fecha', primerDiaMes),
    ])
    cobros6m = _cobros6m ?? []
    asistenciasMes = _asistMesPorHora ?? []
  }

  // ─── Cálculos Pro ─────────────────────────────────────
  const totalAnt        = cobrosAnt.reduce((s, c) => s + Number(c.monto), 0)
  const pctIngresos     = isPro ? pctChange(totalMes, totalAnt) : null
  const promedioDiario  = diasConAsistencia > 0 ? Math.round(asistenciasMesCount / diasConAsistencia) : 0
  const promedioAnt     = diasMesAnt > 0 ? Math.round(asistenciasAntTotal / diasMesAnt) : 0
  const pctAsist        = pctChange(promedioDiario, promedioAnt)

  const ultimaAsistMap = new Map<string, string>()
  for (const a of asist20dData) {
    if (!ultimaAsistMap.has(a.alumno_id)) ultimaAsistMap.set(a.alumno_id, a.fecha)
  }
  const ids10d = new Set(asist20dData.filter(a => a.fecha >= hace10d).map(a => a.alumno_id))
  const ids20d = new Set(asist20dData.map(a => a.alumno_id))
  const inactivos20plus = alumnosConMemb.filter(a => !ids20d.has(a.id))
  const inactivos10a20  = alumnosConMemb.filter(a => !ids10d.has(a.id) && ids20d.has(a.id))

  // Fetch last visit (up to 90 days) only for alumnos who've been away 20+ days
  if (isPro && inactivos20plus.length > 0) {
    const { data: ultimaVisita } = await supabase
      .from('asistencias')
      .select('alumno_id, fecha')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha', hace90d)
      .lt('fecha', hace20d)
      .in('alumno_id', inactivos20plus.map(a => a.id))
      .order('fecha', { ascending: false })
      .limit(500)
    for (const a of ultimaVisita ?? []) {
      if (!ultimaAsistMap.has(a.alumno_id)) ultimaAsistMap.set(a.alumno_id, a.fecha)
    }
  }

  const todosInactivos  = [...inactivos20plus, ...inactivos10a20]

  // ─── Cálculos Premium ─────────────────────────────────
  const porHora = Array<number>(24).fill(0)
  for (const a of asistenciasMes) {
    const localH = (new Date(a.checked_in_at).getUTCHours() - 3 + 24) % 24
    porHora[localH]++
  }
  const horasBars = Array.from({ length: 17 }, (_, i) => ({
    label: String(i + 6).padStart(2, '0'),
    value: porHora[i + 6],
  }))
  const picoIdx = porHora.indexOf(Math.max(...porHora))

  const ingresosPorMes: Record<string, number> = {}
  for (const c of cobros6m) {
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

  // ─── Semáforo (Pro+) ──────────────────────────────────
  const activosRatio   = (totalAlumnos ?? 0) > 0 ? (alumnosActivos ?? 0) / (totalAlumnos ?? 1) : 0
  const inactivosRatio = (alumnosActivos ?? 0) > 0 ? todosInactivos.length / (alumnosActivos ?? 1) : 0
  const pctActivos     = Math.round(activosRatio * 100)

  let semaforo: 'excelente' | 'bueno' | 'atencion' = 'bueno'
  if (isPro) {
    if (activosRatio >= 0.45 && inactivosRatio < 0.25) {
      semaforo = 'excelente'
    } else if (activosRatio >= 0.3 || inactivosRatio < 0.4) {
      semaforo = 'bueno'
    } else {
      semaforo = 'atencion'
    }
  }

  const SEM = {
    excelente: {
      icon: '🟢', label: 'Excelente',
      frase: 'Tu gimnasio está funcionando muy bien.',
      cn: 'bg-green-50 border-green-200',
      titleCn: 'text-green-800', textCn: 'text-green-700', dividerCn: 'border-green-200',
    },
    bueno: {
      icon: '🟡', label: 'Atención',
      frase: 'Hay algunas oportunidades de mejora.',
      cn: 'bg-yellow-50 border-yellow-200',
      titleCn: 'text-yellow-800', textCn: 'text-yellow-700', dividerCn: 'border-yellow-200',
    },
    atencion: {
      icon: '🔴', label: 'Crítico',
      frase: 'Hay alumnos y cobros que requieren acción inmediata.',
      cn: 'bg-red-50 border-red-200',
      titleCn: 'text-red-800', textCn: 'text-red-700', dividerCn: 'border-red-200',
    },
  }[semaforo]

  // Fortalezas — lo que está bien
  const fortalezas: string[] = []
  if (isPro) {
    if (pctActivos >= 60) fortalezas.push(`${pctActivos}% de alumnos activos`)
    if ((vencidos ?? 0) === 0) fortalezas.push('Sin cuotas vencidas')
    if (esOwner && pctIngresos !== null && pctIngresos > 0) fortalezas.push(`Ingresos subieron ${pctIngresos}% vs mes pasado`)
    if (promedioDiario > 0 && asistenciasHoyCount >= promedioDiario) fortalezas.push('Buena asistencia hoy')
    if (todosInactivos.length === 0) fortalezas.push('Todos los alumnos asistieron recientemente')
  }

  // Acciones recomendadas
  const acciones: { icon: string; text: string; href: string }[] = []
  if (isPro) {
    if (esOwner && (vencidos ?? 0) > 0)
      acciones.push({ icon: '💰', text: `Cobrar ${vencidos} membresía${(vencidos ?? 0) !== 1 ? 's' : ''} vencida${(vencidos ?? 0) !== 1 ? 's' : ''}`, href: '/admin/cobros' })
    if (todosInactivos.length > 0)
      acciones.push({ icon: '💬', text: `Contactar ${todosInactivos.length} alumno${todosInactivos.length !== 1 ? 's' : ''} inactivo${todosInactivos.length !== 1 ? 's' : ''}`, href: '#inactivos' })
    if ((rutinasPorVencer ?? 0) > 0)
      acciones.push({ icon: '📋', text: `Renovar ${rutinasPorVencer} rutina${(rutinasPorVencer ?? 0) !== 1 ? 's' : ''} esta semana`, href: '/admin/alumnos' })
    if (esOwner && (porVencer7 ?? 0) > 0 && (vencidos ?? 0) === 0)
      acciones.push({ icon: '⏰', text: `${porVencer7} membresía${(porVencer7 ?? 0) !== 1 ? 's' : ''} por vencer esta semana`, href: '/admin/cobros' })
  }

  // ─── Sub-textos tiles Row 1 ───────────────────────────
  const ingresosValue = totalMes === 0 ? 'Sin cobros' : `$${totalMes.toLocaleString('es-AR')}`
  const ingresosSub   = totalMes === 0
    ? 'Aún no hay registros este mes'
    : isPro && pctIngresos !== null
      ? `${pctIngresos >= 0 ? '↑' : '↓'} ${Math.abs(pctIngresos)}% vs mes pasado`
      : undefined
  const ingresosSubColor: SubColor = totalMes === 0 ? 'gray'
    : pctIngresos === null ? 'gray'
    : pctIngresos >= 0 ? 'green' : 'red'

  // ─── Sub-textos tiles Row 2 ───────────────────────────
  const asistHoySub = promedioDiario > 0
    ? asistenciasHoyCount > promedioDiario
      ? `↑ Por encima del promedio (${promedioDiario}/día)`
      : asistenciasHoyCount < promedioDiario
        ? `↓ Por debajo del promedio (${promedioDiario}/día)`
        : `≈ En el promedio (${promedioDiario}/día)`
    : `Promedio: ${promedioDiario}/día`
  const asistHoySubColor: SubColor = promedioDiario > 0
    ? asistenciasHoyCount >= promedioDiario ? 'green' : 'orange'
    : 'gray'

  const promSub = pctAsist !== null
    ? `${pctAsist >= 0 ? '↑' : '↓'} ${Math.abs(pctAsist)}% vs mes pasado`
    : 'promedio diario del mes'
  const promSubColor: SubColor = pctAsist === null ? 'gray' : pctAsist >= 0 ? 'green' : 'red'

  const renovSub = renovaciones === 0
    ? 'Nadie renovó este mes aún'
    : `Este mes renovaron ${renovaciones} alumno${renovaciones !== 1 ? 's' : ''}`

  // ─── Render ───────────────────────────────────────────
  return (
    <div className="space-y-5 pb-10">

      {/* Semáforo expandido — Pro+ */}
      {isPro && (
        <div className={`rounded-2xl border px-5 py-5 ${SEM.cn}`}>
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{SEM.icon}</span>
            <span className={`font-heading font-bold text-base ${SEM.titleCn}`}>
              Estado del gimnasio: {SEM.label}
            </span>
          </div>
          <p className={`text-sm font-body mb-4 ${SEM.textCn}`}>{SEM.frase}</p>

          {semaforo === 'excelente' ? (
            <>
              {fortalezas.length > 0 && (
                <div className="mb-3">
                  <p className={`text-xs font-semibold font-body uppercase tracking-wide mb-2 ${SEM.titleCn}`}>
                    ¿Qué está bien?
                  </p>
                  <ul className="space-y-1.5">
                    {fortalezas.map((f) => (
                      <li key={f} className={`flex items-center gap-2 text-sm font-body ${SEM.textCn}`}>
                        <span className="text-base leading-none">✅</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {acciones.length > 0 && (
                <div className={`pt-3 border-t ${SEM.dividerCn}`}>
                  <p className={`text-xs font-semibold font-body uppercase tracking-wide mb-2 ${SEM.titleCn}`}>
                    Oportunidades de esta semana
                  </p>
                  <ul className="space-y-1.5">
                    {acciones.map((a) => (
                      <li key={a.text}>
                        <Link href={a.href} className={`flex items-center gap-2 text-sm font-body hover:underline ${SEM.textCn}`}>
                          <span className="text-base leading-none">{a.icon}</span>
                          <span>{a.text} →</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            acciones.length > 0 && (
              <>
                <p className={`text-xs font-semibold font-body uppercase tracking-wide mb-3 ${SEM.titleCn}`}>
                  Hoy te recomendamos:
                </p>
                <ul className="space-y-2.5">
                  {acciones.map((a) => (
                    <li key={a.text}>
                      <Link
                        href={a.href}
                        className={`flex items-center gap-3 text-sm font-body font-semibold hover:underline ${SEM.titleCn}`}
                      >
                        <span className="text-base leading-none">{a.icon}</span>
                        <span>{a.text} →</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )
          )}
        </div>
      )}

      {/* Row 1 */}
      <div className={`grid gap-3 ${esOwner ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2'}`}>
        <Tile
          href="/admin/alumnos"
          label="Alumnos activos"
          value={String(alumnosActivos ?? 0)}
          color="blue"
          icon={ICONS.users}
          sub={
            isPro && totalNuevos > 0
              ? `↑ +${totalNuevos} nuevos este mes`
              : `de ${totalAlumnos ?? 0} totales`
          }
          subColor={isPro && totalNuevos > 0 ? 'green' : 'gray'}
          cta="Ver listado"
        />
        {esOwner && (
          <Tile
            href="/admin/cobros"
            label="Ingresos del mes"
            value={ingresosValue}
            color="green"
            icon={ICONS.cash}
            sub={ingresosSub}
            subColor={ingresosSubColor}
            cta="Ver historial"
          />
        )}
        <Tile
          href={esOwner ? '/admin/cobros' : '/admin/alumnos'}
          label="Por vencer (7d)"
          value={String(porVencer7 ?? 0)}
          color="orange"
          icon={ICONS.clock}
          sub={(porVencer7 ?? 0) > 0 ? 'membresías próximas a vencer' : 'Ninguna por vencer'}
          subColor={(porVencer7 ?? 0) > 0 ? 'orange' : 'green'}
          cta={(porVencer7 ?? 0) > 0 ? 'Ver membresías' : undefined}
        />
        <Tile
          href={esOwner ? '/admin/cobros' : '/admin/alumnos'}
          label="Cuotas vencidas"
          value={String(vencidos ?? 0)}
          color="red"
          icon={ICONS.warning}
          sub={(vencidos ?? 0) > 0 ? 'Membresías vencidas' : 'Sin vencidas ✓'}
          subColor={(vencidos ?? 0) > 0 ? 'red' : 'green'}
          cta={(vencidos ?? 0) > 0 ? 'Ver alumnos' : undefined}
        />
      </div>

      {/* Row 2 — Pro+ */}
      {isPro && (
        <div className="grid grid-cols-2 gap-3">
          <Tile
            href="/admin/asistencias"
            label="Asistencias hoy"
            value={String(asistenciasHoyCount)}
            color="sky"
            icon={ICONS.check}
            sub={asistHoySub}
            subColor={asistHoySubColor}
            cta="Ver asistencias"
          />
          <Tile
            href="/admin/alumnos"
            label="Nuevos este mes"
            value={String(totalNuevos)}
            color="blue"
            icon={ICONS.userPlus}
            sub={
              [
                (nuevosEsteMes ?? 0) > 0 ? `${nuevosEsteMes} con cuenta` : null,
                nuevosExternos > 0 ? `${nuevosExternos} externos` : null,
                retornantes > 0 ? `${retornantes} retornantes` : null,
              ].filter(Boolean).join(' · ') || undefined
            }
            subColor="gray"
            cta="Ver alumnos"
          />
          {esOwner && (
            <Tile
              href="/admin/cobros"
              label="Renovaciones"
              value={String(renovaciones)}
              color="green"
              icon={ICONS.refresh}
              sub={renovSub}
              subColor={renovaciones > 0 ? 'green' : 'gray'}
              cta="Ver cobros"
            />
          )}
          <Tile
            href="/admin/alumnos"
            label="Rutinas (7d)"
            value={String(rutinasPorVencer ?? 0)}
            color="orange"
            icon={ICONS.clipboard}
            sub={(rutinasPorVencer ?? 0) > 0 ? 'rutinas por renovar' : 'Ninguna por vencer'}
            subColor={(rutinasPorVencer ?? 0) > 0 ? 'orange' : 'green'}
            cta={(rutinasPorVencer ?? 0) > 0 ? 'Ver alumnos' : undefined}
          />
        </div>
      )}

      {/* Último comunicado — todos los planes */}
      {ultimoComunicado && (
        <div className="bg-white rounded-2xl shadow-sm px-5 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="section-label text-xs font-body font-semibold tracking-widest text-navy/40 uppercase mb-0.5">
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

      {/* Inactivos — Pro+ */}
      {isPro && (
        <div id="inactivos" className="bg-white rounded-2xl shadow-sm px-5 py-5">
          <div className="flex items-start justify-between mb-4 gap-4">
            <div>
              <p className="section-label text-xs font-body font-semibold tracking-widest text-navy/40 uppercase">
                Inactivos
              </p>
              <p className="text-sm font-body text-navy mt-0.5">
                {todosInactivos.length === 0 ? (
                  'Ningún alumno inactivo esta semana.'
                ) : (
                  <>
                    <span className="font-bold">{todosInactivos.length}</span>
                    {' sin venir hace más de 10 días'}
                    {inactivos20plus.length > 0 && (
                      <span className="text-red-500 ml-1">
                        ({inactivos20plus.length} hace más de 20 días)
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>
          </div>

          {todosInactivos.length === 0 ? (
            <p className="text-sm text-emerald-600 font-body">✓ Todos vinieron en los últimos 10 días.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {todosInactivos.map((a) => {
                const esMas20   = inactivos20plus.some(i => i.id === a.id)
                const ultimaFecha = ultimaAsistMap.get(a.id)
                const waUrl     = a.whatsapp ? buildWaUrl(a.whatsapp, gymName, a.nombre_completo) : null
                return (
                  <li key={a.id} className="flex items-center justify-between py-3 gap-3">
                    <div className="flex items-start gap-2 min-w-0">
                      {esMas20
                        ? <span className="mt-1 w-2 h-2 rounded-full bg-red-400 shrink-0" />
                        : <span className="mt-1 w-2 h-2 rounded-full bg-orange-300 shrink-0" />
                      }
                      <div className="min-w-0">
                        <Link
                          href={`/admin/alumnos/${a.id}`}
                          className="text-sm font-body font-medium text-navy hover:text-orange transition-colors truncate block"
                        >
                          {a.nombre_completo}
                        </Link>
                        <p className="text-xs text-navy/40 font-body">
                          Última asistencia: {diasDesde(ultimaFecha, hoy)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <RegistrarContactoModal
                        alumnoId={a.id}
                        alumnoNombre={a.nombre_completo}
                        motivoDefault="reactivacion"
                      />
                      {waUrl ? (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Enviar mensaje por WhatsApp"
                          className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                        >
                          <WaIcon />
                        </a>
                      ) : (
                        <span className="text-xs text-navy/30 font-body">Sin tel.</span>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      {/* Gráficos — Premium */}
      {isPremium && (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Tile
            href="/admin/asistencias"
            label="Promedio diario"
            value={`${promedioDiario}/día`}
            color="sky"
            sub={promSub}
            subColor={promSubColor}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {esOwner && (
            <div className="bg-white rounded-2xl shadow-sm px-5 py-5">
              <p className="text-xs font-body font-semibold tracking-widest text-navy/40 uppercase mb-1">
                Evolución de ingresos
              </p>
              <p className="text-2xl font-heading font-extrabold text-emerald-600 mb-4">
                ${Math.max(...ingresosBars.map(b => b.value)).toLocaleString('es-AR')}
              </p>
              <MiniBar bars={ingresosBars} color="#059669" />
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm px-5 py-5">
            <p className="text-xs font-body font-semibold tracking-widest text-navy/40 uppercase mb-1">
              Horario pico (este mes)
            </p>
            <p className="text-2xl font-heading font-extrabold text-sky-500 mb-4">
              {porHora.some(v => v > 0)
                ? `${String(picoIdx).padStart(2,'0')}:00 – ${String(picoIdx + 1).padStart(2,'0')}:00`
                : 'Sin datos'}
            </p>
            <MiniBar bars={horasBars} color="#0ea5e9" />
          </div>
        </div>
        </>
      )}

    </div>
  )
}
