import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSession } from '@/lib/admin-auth'
import { canUse, getRequiredPlanLabel } from '@/lib/plan-features'
import UpgradeGate from '@/components/UpgradeGate'
import { getMondayOfWeek, getWeekDates, getISODow, getTodayAR, formatSemanaLabel, addDays } from './dateUtils'
import type { ClaseOcurrencia } from './types'
import CalendarioSemanal from './CalendarioSemanal'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{ offset?: string }>

export default async function ClasesPage({ searchParams }: { searchParams: SearchParams }) {
  const { gimnasioId, plan } = await getAdminSession()

  if (!canUse(plan, 'clases')) {
    return <UpgradeGate requiredPlan={getRequiredPlanLabel('clases')} />
  }

  const { offset: offsetStr } = await searchParams
  const offset = parseInt(offsetStr ?? '0', 10) || 0

  const lunes = getMondayOfWeek(offset)
  const domingo = addDays(lunes, 6)
  const fechas = getWeekDates(lunes)
  const hoy = getTodayAR()
  const semanaLabel = formatSemanaLabel(lunes, domingo)

  const supabase = createAdminClient()

  // 1. Load active series versions that overlap this week
  const { data: versiones } = await supabase
    .from('clases_versiones')
    .select(`
      id,
      serie_id,
      dia_semana,
      hora_inicio,
      duracion_minutos,
      cupo_maximo,
      instructor,
      descripcion,
      fecha_desde,
      fecha_hasta,
      clases_series!inner ( id, nombre, activa, gimnasio_id )
    `)
    .eq('clases_series.gimnasio_id', gimnasioId)
    .eq('clases_series.activa', true)
    .lte('fecha_desde', domingo)
    .or(`fecha_hasta.is.null,fecha_hasta.gte.${lunes}`)

  // 2. Load exceptions for this week (modifications, cancellations, specials)
  const { data: excepciones } = await supabase
    .from('clases_excepciones')
    .select('*')
    .eq('gimnasio_id', gimnasioId)
    .gte('fecha', lunes)
    .lte('fecha', domingo)

  // 3. Load confirmed reservation counts for this week
  const { data: reservas } = await supabase
    .from('clases_reservas')
    .select('serie_id, excepcion_id, fecha_ocurrencia')
    .eq('gimnasio_id', gimnasioId)
    .eq('estado', 'confirmada')
    .gte('fecha_ocurrencia', lunes)
    .lte('fecha_ocurrencia', domingo)

  // Build count maps
  const cntSerie: Record<string, number> = {}   // key: `${serie_id}|${fecha}`
  const cntExcep: Record<string, number> = {}   // key: excepcion_id
  for (const r of reservas ?? []) {
    if (r.excepcion_id) {
      cntExcep[r.excepcion_id] = (cntExcep[r.excepcion_id] ?? 0) + 1
    } else if (r.serie_id && r.fecha_ocurrencia) {
      const k = `${r.serie_id}|${r.fecha_ocurrencia}`
      cntSerie[k] = (cntSerie[k] ?? 0) + 1
    }
  }

  type ExRow = NonNullable<typeof excepciones>[number]

  // Index exceptions by serie_id+fecha and by id
  const excBySerieYFecha: Record<string, ExRow> = {}
  const excEspeciales: ExRow[] = []
  for (const ex of excepciones ?? []) {
    if (ex.tipo === 'clase_especial') {
      excEspeciales.push(ex)
    } else if (ex.serie_id) {
      excBySerieYFecha[`${ex.serie_id}|${ex.fecha}`] = ex
    }
  }

  // Build occurrences
  const ocurrencias: ClaseOcurrencia[] = []

  for (const fecha of fechas) {
    const dow = getISODow(fecha)

    // Recurring occurrences
    for (const v of versiones ?? []) {
      if (v.dia_semana !== dow) continue
      if (v.fecha_desde > fecha) continue
      if (v.fecha_hasta && v.fecha_hasta < fecha) continue

      const ex = excBySerieYFecha[`${v.serie_id}|${fecha}`]

      if (ex?.tipo === 'cancelacion') {
        ocurrencias.push({
          serie_id: v.serie_id,
          excepcion_id: ex.id,
          version_id: v.id,
          dia_semana: v.dia_semana,
          fecha,
          nombre: (v.clases_series as any).nombre,
          hora_inicio: v.hora_inicio,
          duracion_minutos: v.duracion_minutos,
          cupo_maximo: v.cupo_maximo,
          instructor: v.instructor,
          descripcion: v.descripcion,
          cancelada: true,
          es_especial: false,
          confirmadas: cntExcep[ex.id] ?? cntSerie[`${v.serie_id}|${fecha}`] ?? 0,
        })
      } else {
        const nombre = ex?.nombre ?? (v.clases_series as any).nombre
        const hora_inicio = ex?.hora_inicio ?? v.hora_inicio
        const duracion_minutos = ex?.duracion_minutos ?? v.duracion_minutos
        const cupo_maximo = ex?.cupo_maximo ?? v.cupo_maximo
        const instructor = ex?.instructor ?? v.instructor
        const descripcion = ex?.descripcion ?? v.descripcion
        const confirmadas = ex
          ? (cntExcep[ex.id] ?? 0)
          : (cntSerie[`${v.serie_id}|${fecha}`] ?? 0)

        ocurrencias.push({
          serie_id: v.serie_id,
          excepcion_id: ex?.id ?? null,
          version_id: v.id,
          dia_semana: v.dia_semana,
          fecha,
          nombre,
          hora_inicio,
          duracion_minutos,
          cupo_maximo,
          instructor,
          descripcion,
          cancelada: false,
          es_especial: false,
          confirmadas,
        })
      }
    }

    // Special classes on this date
    for (const ex of excEspeciales) {
      if (ex.fecha !== fecha) continue
      ocurrencias.push({
        serie_id: null,
        excepcion_id: ex.id,
        version_id: null,
        dia_semana: dow,
        fecha,
        nombre: ex.nombre ?? 'Clase especial',
        hora_inicio: ex.hora_inicio ?? '00:00',
        duracion_minutos: ex.duracion_minutos ?? 60,
        cupo_maximo: ex.cupo_maximo ?? 0,
        instructor: ex.instructor ?? '',
        descripcion: ex.descripcion ?? null,
        cancelada: false,
        es_especial: true,
        confirmadas: cntExcep[ex.id] ?? 0,
      })
    }
  }

  // Sort by fecha then hora_inicio
  ocurrencias.sort((a, b) =>
    a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : a.hora_inicio.localeCompare(b.hora_inicio)
  )

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-heading font-extrabold text-navy">Clases</h2>
        <Link
          href="/admin/clases/horarios"
          className="text-xs font-body font-semibold text-navy/50 hover:text-navy transition-colors flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Horarios habituales
        </Link>
      </div>

      <CalendarioSemanal
        ocurrencias={ocurrencias}
        fechas={fechas}
        hoy={hoy}
        offset={offset}
        semanaLabel={semanaLabel}
      />
    </div>
  )
}
