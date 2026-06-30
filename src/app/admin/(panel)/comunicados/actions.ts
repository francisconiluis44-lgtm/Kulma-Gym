'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function publicarComunicado(
  _prevState: { error: string | null; ok: boolean },
  formData: FormData
): Promise<{ error: string | null; ok: boolean }> {
  const titulo = (formData.get('titulo') as string)?.trim()
  const cuerpo = (formData.get('cuerpo') as string)?.trim()
  const file = formData.get('imagen') as File | null

  if (!titulo || !cuerpo) {
    return { error: 'Completá el título y el contenido.', ok: false }
  }

  const adminSupabase = createAdminClient()
  let imagen_url: string | null = null

  if (file && file.size > 0) {
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}.${ext}`
    const bytes = await file.arrayBuffer()
    const { error: uploadError } = await adminSupabase.storage
      .from('comunicados')
      .upload(path, bytes, { contentType: file.type, upsert: false })

    if (uploadError) {
      return { error: `Error al subir imagen: ${uploadError.message}`, ok: false }
    }

    const { data: urlData } = adminSupabase.storage
      .from('comunicados')
      .getPublicUrl(path)

    imagen_url = urlData.publicUrl
  }

  const { error } = await adminSupabase
    .from('comunicados')
    .insert({ titulo, cuerpo, imagen_url })

  if (error) {
    return { error: error.message, ok: false }
  }

  revalidatePath('/admin/comunicados')
  revalidatePath('/dashboard')
  return { error: null, ok: true }
}

export async function eliminarComunicado(id: string) {
  const adminSupabase = createAdminClient()

  // Delete image from storage if exists
  const { data: comunicado } = await adminSupabase
    .from('comunicados')
    .select('imagen_url')
    .eq('id', id)
    .single()

  if (comunicado?.imagen_url) {
    const path = comunicado.imagen_url.split('/').pop()
    if (path) {
      await adminSupabase.storage.from('comunicados').remove([path])
    }
  }

  await adminSupabase.from('comunicados').delete().eq('id', id)
  revalidatePath('/admin/comunicados')
  revalidatePath('/dashboard')
}
