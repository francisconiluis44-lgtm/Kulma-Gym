import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSession } from '@/lib/admin-auth'
import ColaboradoresClient from './ColaboradoresClient'

export const dynamic = 'force-dynamic'

export default async function ColaboradoresPage() {
  const { gimnasioId, rol } = await getAdminSession()
  if (rol !== 'owner') redirect('/admin')

  const adminSupabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = adminSupabase as any

  // Get all collaborators (non-owner admins) for this gym
  const { data: rows } = await sb
    .from('gym_admins')
    .select('user_id, rol')
    .eq('gimnasio_id', gimnasioId)
    .eq('rol', 'colaborador')

  const colaboradores = await Promise.all(
    ((rows ?? []) as { user_id: string; rol: string }[]).map(async (row) => {
      const { data: userData } = await adminSupabase.auth.admin.getUserById(row.user_id)
      const user = userData?.user
      const nombre =
        (user?.user_metadata?.nombre_completo as string | undefined) ??
        user?.email?.split('@')[0] ??
        'Sin nombre'
      return {
        userId: row.user_id,
        email: user?.email ?? '',
        nombre,
      }
    }),
  )

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h2 className="text-2xl font-heading font-extrabold text-navy">Colaboradores</h2>
        <p className="text-sm font-body text-navy/50 mt-1">
          Cuentas con acceso al panel, sin ver cobros.
        </p>
      </div>

      <ColaboradoresClient colaboradores={colaboradores} />
    </div>
  )
}
