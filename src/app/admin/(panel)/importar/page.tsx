import { getAdminSession } from '@/lib/admin-auth'
import ImportarExcel from './ImportarExcel'
import type { TipoImport } from '@/services/importar'

export const dynamic = 'force-dynamic'

export default async function ImportarPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>
}) {
  await getAdminSession()
  const { tipo } = await searchParams
  const tipoInicial: TipoImport | undefined =
    tipo === 'asistencias' || tipo === 'cobros' ? tipo : undefined
  return <ImportarExcel tipoInicial={tipoInicial} />
}
