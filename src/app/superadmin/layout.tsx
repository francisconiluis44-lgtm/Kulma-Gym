import Link from 'next/link'
import { getSuperadminSession } from '@/lib/superadmin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { signOut } from '@/app/actions'

export default async function SuperadminLayout({ children }: { children: React.ReactNode }) {
  await getSuperadminSession()

  const adminSupabase = createAdminClient()
  const { count: pendientes } = await adminSupabase
    .from('solicitudes_admin')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'pendiente')

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-body text-orange font-semibold tracking-widest uppercase">
              Superadmin
            </p>
            <h1 className="text-xl font-heading font-extrabold leading-tight text-white">
              SimpleGym
            </h1>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/superadmin" className="text-sm font-body text-white/60 hover:text-white transition-colors">
              Gimnasios
            </Link>
            <Link href="/superadmin/solicitudes" className="relative text-sm font-body text-white/60 hover:text-white transition-colors">
              Solicitudes
              {(pendientes ?? 0) > 0 && (
                <span className="absolute -top-1.5 -right-3 bg-orange text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {pendientes}
                </span>
              )}
            </Link>
          </nav>
          <form action={signOut}>
            <button type="submit" className="text-sm font-body text-white/50 hover:text-white transition-colors">
              Salir
            </button>
          </form>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
