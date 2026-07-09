'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getGaleriaSession } from '@/lib/galeria-auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function signOutGaleria() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/galeria/login')
}

export async function crearCarpeta(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  await getGaleriaSession()
  const nombre = (formData.get('nombre') as string)?.trim()

  if (!nombre) {
    return { error: 'Poné un nombre para la carpeta.' }
  }

  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase.from('galeria_carpetas').insert({ nombre })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/galeria')
  return { error: null }
}

export async function renombrarCarpeta(carpetaId: string, nombre: string) {
  await getGaleriaSession()
  const nombreTrim = nombre.trim()
  if (!nombreTrim) return

  const adminSupabase = createAdminClient()
  await adminSupabase.from('galeria_carpetas').update({ nombre: nombreTrim }).eq('id', carpetaId)

  revalidatePath('/galeria')
}

export async function eliminarCarpeta(carpetaId: string) {
  await getGaleriaSession()
  const adminSupabase = createAdminClient()

  const { data: archivos } = await adminSupabase
    .from('galeria_archivos')
    .select('storage_path')
    .eq('carpeta_id', carpetaId)

  if (archivos && archivos.length > 0) {
    await adminSupabase.storage.from('galeria').remove(archivos.map((a) => a.storage_path))
  }

  await adminSupabase.from('galeria_carpetas').delete().eq('id', carpetaId)

  revalidatePath('/galeria')
}

export async function registrarArchivo(
  carpetaId: string,
  storagePath: string,
  tipo: 'imagen' | 'video',
  nombreOriginal: string
) {
  await getGaleriaSession()
  const adminSupabase = createAdminClient()

  const { error } = await adminSupabase.from('galeria_archivos').insert({
    carpeta_id: carpetaId,
    storage_path: storagePath,
    tipo,
    nombre_original: nombreOriginal,
  })

  if (error) {
    // Si el registro falla, no dejamos el archivo huérfano en el storage
    await adminSupabase.storage.from('galeria').remove([storagePath])
    throw new Error(error.message)
  }

  revalidatePath(`/galeria/${carpetaId}`)
}

export async function eliminarArchivos(carpetaId: string, archivoIds: string[]) {
  await getGaleriaSession()
  if (archivoIds.length === 0) return

  const adminSupabase = createAdminClient()

  const { data: archivos } = await adminSupabase
    .from('galeria_archivos')
    .select('id, storage_path')
    .in('id', archivoIds)

  if (archivos && archivos.length > 0) {
    await adminSupabase.storage.from('galeria').remove(archivos.map((a) => a.storage_path))
    await adminSupabase.from('galeria_archivos').delete().in('id', archivoIds)
  }

  revalidatePath(`/galeria/${carpetaId}`)
}
