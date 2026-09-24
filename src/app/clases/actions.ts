'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getGymContext } from '@/lib/gym-context'
import { revalidatePath } from 'next/cache'

function getMesRange(): { inicioMes: string; finMes: string } {
  const hoyAR = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
  const [yearStr, monthStr] = hoyAR.split('-')
  const nextMonthNum = parseInt(monthStr) + 1
  const finMes = nextMonthNum > 12
    ? `${parseInt(yearStr) + 1}-01-01`
    : `${yearStr}-${String(nextMonthNum).padStart(2, '0')}-01`
  return { inicioMes: `${yearStr}-${monthStr}-01`, finMes }
}

function getMondayOfDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  const dow = d.getUTCDay()
  const daysToMonday = dow === 0 ? -6 : 1 - dow
  d.setUTCDate(d.getUTCDate() + daysToMonday)
  return d.toISOString().split('T')[0]!
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().split('T')[0]!
}

interface ReservaParams {
  serieId: string | null
  excepcionId: string | null
  fechaOcurrencia: string
  cupoMaximo: number
}

export async function reservarClase(params: ReservaParams): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const gym = await getGymContext()
  const adminSupabase = createAdminClient()

  // Cupo físico de la clase
  if (params.cupoMaximo > 0) {
    const { count } = await adminSupabase
      .from('clases_reservas')
      .select('id', { count: 'exact', head: true })
      .eq('gimnasio_id', gym.id)
      .eq('estado', 'confirmada')
      .eq('fecha_ocurrencia', params.fechaOcurrencia)
      .eq(
        params.excepcionId ? 'excepcion_id' : 'serie_id',
        params.excepcionId ?? params.serieId ?? '',
      )

    if ((count ?? 0) >= params.cupoMaximo) return { error: 'No hay cupo disponible.' }
  }

  // Cuota mensual/semanal del alumno
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: alumnoData } = await (adminSupabase.from('alumnos') as any)
    .select('clases_por_mes, clases_por_semana')
    .eq('id', user.id)
    .single()

  const alumnoQ = alumnoData as { clases_por_mes?: number | null; clases_por_semana?: number | null } | null
  const cuotaMes = alumnoQ?.clases_por_mes ?? null
  const cuotaSemana = alumnoQ?.clases_por_semana ?? null

  if (cuotaSemana !== null) {
    const monday = getMondayOfDate(params.fechaOcurrencia)
    const sunday = addDays(monday, 6)
    const { count: usadasSemana } = await adminSupabase
      .from('clases_reservas')
      .select('id', { count: 'exact', head: true })
      .eq('alumno_id', user.id)
      .eq('gimnasio_id', gym.id)
      .in('estado', ['confirmada', 'asistida', 'ausente'])
      .gte('fecha_ocurrencia', monday)
      .lte('fecha_ocurrencia', sunday)

    if ((usadasSemana ?? 0) >= cuotaSemana) {
      return { error: `Alcanzaste el límite de ${cuotaSemana} turnos para esta semana.` }
    }
  } else if (cuotaMes !== null) {
    const { inicioMes, finMes } = getMesRange()
    const { count: usadas } = await adminSupabase
      .from('clases_reservas')
      .select('id', { count: 'exact', head: true })
      .eq('alumno_id', user.id)
      .eq('gimnasio_id', gym.id)
      .in('estado', ['confirmada', 'asistida', 'ausente'])
      .gte('fecha_ocurrencia', inicioMes)
      .lt('fecha_ocurrencia', finMes)

    if ((usadas ?? 0) >= cuotaMes) {
      return { error: `Alcanzaste el límite de ${cuotaMes} clases para este mes.` }
    }
  }

  const { error } = await adminSupabase
    .from('clases_reservas')
    .insert({
      gimnasio_id: gym.id,
      serie_id: params.serieId,
      excepcion_id: params.excepcionId,
      alumno_id: user.id,
      fecha_ocurrencia: params.fechaOcurrencia,
      estado: 'confirmada',
    })

  if (error) {
    if (error.code === '23505') return { error: 'Ya tenés una reserva para esta clase.' }
    return { error: 'Error al reservar. Intentá de nuevo.' }
  }

  revalidatePath('/clases')
  return { ok: true }
}

interface CancelarParams {
  serieId: string | null
  excepcionId: string | null
  fechaOcurrencia: string
}

export async function cancelarReserva(params: CancelarParams): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  // Bloqueo de cancelación el mismo día
  const hoyAR = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
  if (params.fechaOcurrencia === hoyAR) {
    return { error: 'No podés cancelar una clase el mismo día.' }
  }

  if (!params.serieId && !params.excepcionId) {
    return { error: 'Datos de reserva inválidos.' }
  }

  const gym = await getGymContext()
  const adminSupabase = createAdminClient()

  let findQuery = adminSupabase
    .from('clases_reservas')
    .select('id')
    .eq('alumno_id', user.id)
    .eq('gimnasio_id', gym.id)
    .eq('estado', 'confirmada')
    .eq('fecha_ocurrencia', params.fechaOcurrencia)

  if (params.excepcionId) {
    findQuery = findQuery.eq('excepcion_id', params.excepcionId)
  } else {
    findQuery = findQuery.eq('serie_id', params.serieId!)
  }

  const { data: rows, error: findError } = await findQuery

  if (findError) return { error: findError.message }
  if (!rows || rows.length === 0) return { error: 'Reserva no encontrada.' }

  const ids = rows.map(r => r.id)
  const { error: updateError } = await adminSupabase
    .from('clases_reservas')
    .update({ estado: 'cancelada_alumno' })
    .in('id', ids)

  if (updateError) return { error: updateError.message }

  revalidatePath('/clases')
  return { ok: true }
}
