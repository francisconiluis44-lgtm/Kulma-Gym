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

  const gym = await getGymContext()
  const adminSupabase = createAdminClient()

  const { error } = await adminSupabase
    .from('clases_reservas')
    .update({ estado: 'cancelada' })
    .eq('alumno_id', user.id)
    .eq('gimnasio_id', gym.id)
    .eq('estado', 'confirmada')
    .eq('fecha_ocurrencia', params.fechaOcurrencia)
    .eq(
      params.excepcionId ? 'excepcion_id' : 'serie_id',
      params.excepcionId ?? params.serieId ?? '',
    )

  if (error) return { error: 'Error al cancelar. Intentá de nuevo.' }

  revalidatePath('/clases')
  return { ok: true }
}
