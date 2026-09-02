'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSession } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'

export async function archivarAlumno(alumnoId: string): Promise<{ ok: true } | { error: string }> {
  const { gimnasioId } = await getAdminSession()
  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase
    .from('alumnos')
    .update({ archivado: true })
    .eq('id', alumnoId)
    .eq('gimnasio_id', gimnasioId)
  if (error) return { error: 'Error al archivar el alumno.' }
  revalidatePath(`/admin/alumnos/${alumnoId}`)
  revalidatePath('/admin/alumnos')
  return { ok: true }
}

export async function desarchivarAlumno(alumnoId: string): Promise<{ ok: true } | { error: string }> {
  const { gimnasioId } = await getAdminSession()
  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase
    .from('alumnos')
    .update({ archivado: false })
    .eq('id', alumnoId)
    .eq('gimnasio_id', gimnasioId)
  if (error) return { error: 'Error al desarchivar el alumno.' }
  revalidatePath(`/admin/alumnos/${alumnoId}`)
  revalidatePath('/admin/alumnos')
  return { ok: true }
}

export async function agregarAlumnoExterno(data: {
  nombre_completo: string
  whatsapp?: string
  email?: string
}): Promise<{ ok: true } | { error: string }> {
  const { gimnasioId } = await getAdminSession()
  const adminSupabase = createAdminClient()

  const nombre = data.nombre_completo.trim()
  if (!nombre) return { error: 'El nombre es obligatorio.' }

  const { error } = await adminSupabase
    .from('alumnos_externos')
    .insert({
      gimnasio_id: gimnasioId,
      nombre_completo: nombre,
      whatsapp: data.whatsapp?.trim() || null,
      email: data.email?.trim() || null,
    })

  if (error) return { error: 'Error al agregar el alumno.' }

  revalidatePath('/admin/alumnos')
  return { ok: true }
}
