import { getSuperadminSession } from '@/lib/superadmin-auth'
import { signOut } from '@/app/actions'

export default async function SuperadminLayout({ children }: { children: React.ReactNode }) {
  await getSuperadminSession()

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-body text-orange font-semibold tracking-widest uppercase">
              Superadmin
            </p>
            <h1 className="text-xl font-heading font-extrabold leading-tight text-white">
              Kulma Platform
            </h1>
          </div>
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
