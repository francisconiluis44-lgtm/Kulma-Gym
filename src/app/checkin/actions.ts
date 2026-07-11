'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getGymContext } from '@/lib/gym-context'
import { redirect } from 'next/navigation'

export async function registrarCheckin(): Promise<
  { ok: true; hora: string } | { error: string; hora?: string }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const gym = await getGymContext()
  const adminSupabase = createAdminClient()

  const { data: alumno } = await adminSupabase
    .from('alumnos')
    .select('id')
    .eq('id', user.id)
    .eq('gimnasio_id', gym.id)
    .single()

  if (!alumno) return { error: 'No sos alumno de este gimnasio.' }

  const { data, error } = await adminSupabase
    .from('asistencias')
    .insert({ alumno_id: user.id, gimnasio_id: gym.id, tipo: 'alumno' })
    .select('checked_in_at')
    .single()

  if (error) {
    if (error.code === '23505') {
      const hoyAR = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
      const { data: existing } = await adminSupabase
        .from('asistencias')
        .select('checked_in_at')
        .eq('alumno_id', user.id)
        .eq('fecha', hoyAR)
        .single()
      return { error: 'ya_registrada', hora: existing?.checked_in_at }
    }
    return { error: 'Error al registrar asistencia. Intentá de nuevo.' }
  }

  return { ok: true, hora: data.checked_in_at }
}
