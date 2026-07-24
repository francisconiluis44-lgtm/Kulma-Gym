import { getAdminSession } from '@/lib/admin-auth'
import ImportarExcel from './ImportarExcel'

export const dynamic = 'force-dynamic'

export default async function ImportarPage() {
  await getAdminSession()
  return <ImportarExcel />
}
