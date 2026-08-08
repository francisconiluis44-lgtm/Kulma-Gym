'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getGymContext } from '@/lib/gym-context'
import { revalidatePath } from 'next/cache'

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

  if (!params.serieId && !params.excepcionId) {
    return { error: 'Datos de reserva inválidos.' }
  }

  const gym = await getGymContext()
  const adminSupabase = createAdminClient()

  // Find the reservation first
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
    .update({ estado: 'cancelada' })
    .in('id', ids)

  if (updateError) return { error: updateError.message }

  revalidatePath('/clases')
  return { ok: true }
}
