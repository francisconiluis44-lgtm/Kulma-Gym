import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSession } from '@/lib/admin-auth'
import { getGymContext } from '@/lib/gym-context'
import AdminNav from '@/components/AdminNav'
import AdminOneSignalInit from '@/app/admin/AdminOneSignalInit'
import { signOut } from '@/app/actions'
import Link from 'next/link'

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId, gimnasioId } = await getAdminSession()
  const gym = await getGymContext()

  const adminSupabase = createAdminClient()
  const { count } = await adminSupabase
    .from('mensajes')
    .select('*', { count: 'exact', head: true })
    .eq('gimnasio_id', gimnasioId)
    .eq('leido', false)

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-navy text-white px-4 pt-4 pb-0 shadow-[0_2px_8px_0_rgba(0,0,0,0.18)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {(gym.logo_header_url || gym.logo_url) && (
              <img
                src={gym.logo_header_url ?? gym.logo_url!}
                alt={gym.nombre}
                className={gym.logo_header_url ? 'h-8 w-auto max-w-[120px] object-contain shrink-0' : 'h-8 w-8 rounded-lg object-cover shrink-0'}
              />
            )}
            <div>
              <p className="text-[10px] font-body text-orange/80 font-semibold tracking-[0.14em] uppercase">
                Panel Admin
              </p>
              <h1 className="text-[1.05rem] font-heading font-extrabold leading-tight tracking-tight">
                {gym.nombre}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/admin/cuenta"
              className="text-xs font-body text-white/50 hover:text-white hover:bg-white/10 transition-all px-2.5 py-1.5 rounded-lg"
            >
              Mi cuenta
            </Link>
            <Link
              href="/admin/configuracion"
              className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              title="Configuración"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="text-xs font-body text-white/50 hover:text-white hover:bg-white/10 transition-all px-2.5 py-1.5 rounded-lg"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
        <div className="max-w-4xl mx-auto mt-3">
          <AdminNav unreadMensajes={count ?? 0} plan={gym.plan} />
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">{children}</main>
      <AdminOneSignalInit userId={userId} />
    </div>
  )
}
