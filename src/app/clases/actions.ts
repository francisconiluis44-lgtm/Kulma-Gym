'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getGymContext } from '@/lib/gym-context'
import { revalidatePath } from 'next/cache'

export async function reservarClase(claseId: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const gym = await getGymContext()
  const adminSupabase = createAdminClient()

  const { data: alumno } = await adminSupabase
    .from('alumnos')
    .select('id')
    .eq('id', user.id)
    .eq('gimnasio_id', gym.id)
    .single()

  if (!alumno) return { error: 'No estás registrado en este gimnasio.' }

  const { data, error } = await adminSupabase.rpc('reservar_clase', {
    p_clase_id: claseId,
    p_alumno_id: alumno.id,
    p_gimnasio_id: gym.id,
  })

  if (error) return { error: 'Error al reservar. Intentá de nuevo.' }

  const resultado = data as string
  if (resultado === 'sin_cupo') return { error: 'No hay cupo disponible.' }
  if (resultado === 'clase_cancelada') return { error: 'La clase fue cancelada.' }
  if (resultado === 'clase_no_encontrada') return { error: 'Clase no encontrada.' }
  if (resultado !== 'ok') return { error: 'Error al reservar.' }

  revalidatePath('/clases')
  return { ok: true }
}

export async function cancelarReserva(claseId: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const adminSupabase = createAdminClient()

  const { error } = await adminSupabase
    .from('reservas')
    .update({ estado: 'cancelada' })
    .eq('clase_id', claseId)
    .eq('alumno_id', user.id)

  if (error) return { error: 'Error al cancelar. Intentá de nuevo.' }

  revalidatePath('/clases')
  return { ok: true }
}
