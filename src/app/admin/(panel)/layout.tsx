import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSession } from '@/lib/admin-auth'
import { getGymContext } from '@/lib/gym-context'
import AdminNav from '@/components/AdminNav'
import { signOut } from '@/app/actions'

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { gimnasioId } = await getAdminSession()
  const gym = await getGymContext()

  const adminSupabase = createAdminClient()
  const { count } = await adminSupabase
    .from('mensajes')
    .select('*', { count: 'exact', head: true })
    .eq('gimnasio_id', gimnasioId)
    .eq('leido', false)

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-navy text-white px-4 py-4 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {gym.logo_url && (
              <img src={gym.logo_url} alt={gym.nombre} className="h-8 w-8 rounded-lg object-cover shrink-0" />
            )}
            <div>
              <p className="text-xs font-body text-orange font-semibold tracking-widest uppercase">
                Panel Admin
              </p>
              <h1 className="text-xl font-heading font-extrabold leading-tight">
                {gym.nombre.toUpperCase()}
              </h1>
            </div>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm font-body text-white/70 hover:text-white transition-colors"
            >
              Salir
            </button>
          </form>
        </div>
        <div className="max-w-4xl mx-auto mt-3">
          <AdminNav unreadMensajes={count ?? 0} />
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
