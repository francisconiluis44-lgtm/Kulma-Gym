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

  const { error } = await adminSupabase
    .from('asistencias')
    .insert({ alumno_id: alumnoId, gimnasio_id: gimnasioId, tipo: 'admin' })

  if (error) {
    if (error.code === '23505') return { error: 'ya_registrada' }
    return { error: 'Error al registrar. Intentá de nuevo.' }
  }

  revalidatePath('/admin/asistencias')
  return { ok: true }
}
