'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSession } from '@/lib/admin-auth'
import { canUse } from '@/lib/plan-features'
import { revalidatePath } from 'next/cache'

export async function registrarCheckinManual(alumnoId: string): Promise<
  { ok: true } | { error: string }
> {
  const { gimnasioId, plan } = await getAdminSession()

  if (!canUse(plan, 'asistencias')) return { error: 'Plan no habilitado.' }
  const adminSupabase = createAdminClient()

  const { data: alumno } = await adminSupabase
    .from('alumnos')
    .select('id')
    .eq('id', alumnoId)
    .eq('gimnasio_id', gimnasioId)
    .single()

  if (!alumno) return { error: 'Alumno no encontrado.' }

  const hoyAR = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })

  const { error } = await adminSupabase
    .from('asistencias')
    .insert({ alumno_id: alumnoId, gimnasio_id: gimnasioId, tipo: 'admin', fecha: hoyAR })

  if (error) {
    if (error.code === '23505') return { error: 'ya_registrada' }
    return { error: 'Error al registrar. Intentá de nuevo.' }
  }

  revalidatePath('/admin/asistencias')
  return { ok: true }
}

export async function registrarCheckinManualExterno(alumnoExternoId: string): Promise<
  { ok: true } | { error: string }
> {
  const { gimnasioId, plan } = await getAdminSession()

  if (!canUse(plan, 'asistencias')) return { error: 'Plan no habilitado.' }
  const adminSupabase = createAdminClient()

  const { data: externo } = await adminSupabase
    .from('alumnos_externos')
    .select('id')
    .eq('id', alumnoExternoId)
    .eq('gimnasio_id', gimnasioId)
    .single()

  if (!externo) return { error: 'Alumno no encontrado.' }

  const hoyAR = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })

  const { error } = await adminSupabase
    .from('asistencias_externas')
    .insert({ alumno_externo_id: alumnoExternoId, gimnasio_id: gimnasioId, fecha: hoyAR })

  if (error) {
    if (error.code === '23505') return { error: 'ya_registrada' }
    return { error: 'Error al registrar. Intentá de nuevo.' }
  }

  revalidatePath('/admin/asistencias')
  return { ok: true }
}

export async function getAsistenciasMes(mes: string): Promise<Record<string, number>> {
  const { gimnasioId } = await getAdminSession()
  if (!/^\d{4}-\d{2}$/.test(mes)) return {}

  const adminSupabase = createAdminClient()
  const [mesYear, mesMonth] = mes.split('-').map(Number)
  const ultimoDiaMes = new Date(Date.UTC(mesYear, mesMonth, 0)).getUTCDate()
  const lastDay = `${mes}-${String(ultimoDiaMes).padStart(2, '0')}`

  const [{ data: asistencias }, { data: externas }] = await Promise.all([
    adminSupabase
      .from('asistencias')
      .select('fecha')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha', `${mes}-01`)
      .lte('fecha', lastDay)
      .limit(50000),
    adminSupabase
      .from('asistencias_externas')
      .select('fecha')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha', `${mes}-01`)
      .lte('fecha', lastDay)
      .limit(50000),
  ])

  const result: Record<string, number> = {}
  for (const a of asistencias ?? []) result[a.fecha] = (result[a.fecha] ?? 0) + 1
  for (const a of externas ?? []) result[a.fecha] = (result[a.fecha] ?? 0) + 1
  return result
}

export type AsistenciaDia = {
  registrados: Array<{ id: string; nombre: string; hora: string; tipo: string }>
  importados: Array<{ id: string; nombre: string }>
}

export async function getAsistenciasDia(fecha: string): Promise<AsistenciaDia> {
  const { gimnasioId } = await getAdminSession()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return { registrados: [], importados: [] }

  const adminSupabase = createAdminClient()

  const [{ data: asistencias }, { data: alumnos }, { data: externas }] = await Promise.all([
    adminSupabase
      .from('asistencias')
      .select('id, checked_in_at, tipo, alumno_id')
      .eq('gimnasio_id', gimnasioId)
      .eq('fecha', fecha)
      .order('checked_in_at'),
    adminSupabase
      .from('alumnos')
      .select('id, nombre_completo')
      .eq('gimnasio_id', gimnasioId),
    adminSupabase
      .from('asistencias_externas')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .select('id, alumnos_externos(nombre_completo)' as any)
      .eq('gimnasio_id', gimnasioId)
      .eq('fecha', fecha),
  ])

  const alumnoMap = new Map((alumnos ?? []).map((a) => [a.id, a.nombre_completo]))

  const registrados = (asistencias ?? []).map((a) => ({
    id: a.id,
    nombre: alumnoMap.get(a.alumno_id) ?? '—',
    hora: new Date(a.checked_in_at).toLocaleTimeString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      hour: '2-digit',
      minute: '2-digit',
    }),
    tipo: a.tipo,
  }))

  const importados = (externas as unknown[] ?? []).map((row: unknown, i: number) => {
    const r = row as { id?: string; alumnos_externos?: { nombre_completo?: string } | null }
    return { id: r.id ?? `ext-${i}`, nombre: r?.alumnos_externos?.nombre_completo ?? '—' }
  })

  return { registrados, importados }
}
