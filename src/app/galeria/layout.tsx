import Link from 'next/link'
import { getGaleriaSession } from '@/lib/galeria-auth'
import { signOutGaleria } from './actions'

export default async function GaleriaLayout({ children }: { children: React.ReactNode }) {
  await getGaleriaSession()

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <Link href="/galeria">
            <p className="text-xs font-body text-orange font-semibold tracking-widest uppercase">
              Galería
            </p>
            <h1 className="text-xl font-heading font-extrabold leading-tight text-white">
              Fotos y videos
            </h1>
          </Link>
          <form action={signOutGaleria}>
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
