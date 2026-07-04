import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import AdminNav from '@/components/AdminNav'
import { signOut } from '@/app/actions'

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email?.endsWith('@kulmagym.app')) {
    redirect('/admin/login')
  }

  const adminSupabase = createAdminClient()
  const { count } = await adminSupabase
    .from('mensajes')
    .select('*', { count: 'exact', head: true })
    .eq('leido', false)

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-navy text-white px-4 py-4 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-body text-orange font-semibold tracking-widest uppercase">
              Panel Admin
            </p>
            <h1 className="text-xl font-heading font-extrabold leading-tight">
              KULMA GYM
            </h1>
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
