import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getGaleriaSession } from '@/lib/galeria-auth'
import GaleriaGrid from './GaleriaGrid'

export default async function CarpetaPage({
  params,
}: {
  params: Promise<{ carpetaId: string }>
}) {
  await getGaleriaSession()
  const { carpetaId } = await params
  const adminSupabase = createAdminClient()

  const { data: carpeta } = await adminSupabase
    .from('galeria_carpetas')
    .select('*')
    .eq('id', carpetaId)
    .single()

  if (!carpeta) notFound()

  const { data: archivos } = await adminSupabase
    .from('galeria_archivos')
    .select('*')
    .eq('carpeta_id', carpetaId)
    .order('created_at', { ascending: false })

  const items = (archivos ?? []).map((a) => ({
    id: a.id,
    tipo: a.tipo,
    nombreOriginal: a.nombre_original ?? 'archivo',
    url: adminSupabase.storage.from('galeria').getPublicUrl(a.storage_path).data.publicUrl,
  }))

  return (
    <>
      <Link
        href="/galeria"
        className="inline-flex items-center gap-1 text-sm text-white/40 hover:text-white font-body transition-colors mb-4"
      >
        ← Carpetas
      </Link>

      <div className="mb-6">
        <h2 className="text-2xl font-heading font-bold text-white">{carpeta.nombre}</h2>
        <p className="text-sm text-white/40 font-body mt-0.5">
          {items.length} {items.length === 1 ? 'archivo' : 'archivos'}
        </p>
      </div>

      <GaleriaGrid carpetaId={carpeta.id} carpetaNombre={carpeta.nombre} items={items} />
    </>
  )
}
