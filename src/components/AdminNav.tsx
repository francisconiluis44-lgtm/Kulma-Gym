'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { canUse } from '@/lib/plan-features'

const links = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/alumnos', label: 'Alumnos' },
  { href: '/admin/membresias', label: 'Membresías' },
  { href: '/admin/cobros', label: 'Cobros' },
  { href: '/admin/asistencias', label: 'Asistencias', feature: 'asistencias' },
  { href: '/admin/comunicados', label: 'Comunicados' },
  { href: '/admin/mensajes', label: 'Mensajes' },
  { href: '/admin/ia', label: 'IA' },
  { href: '/admin/importar', label: 'Importar' },
]

const CONFIG_HREF = '/admin/configuracion'

export default function AdminNav({
  unreadMensajes,
  plan,
}: {
  unreadMensajes: number
  plan: string
}) {
  const pathname = usePathname()

  const configActive = pathname.startsWith(CONFIG_HREF)

  return (
    <nav className="flex items-center gap-1 overflow-x-auto">
      {links.map(({ href, label, feature }) => {
        const active =
          href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(href)
        const locked = feature ? !canUse(plan, feature) : false
        return (
          <Link
            key={href}
            href={href}
            className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold font-body transition-colors whitespace-nowrap
              ${active ? 'bg-orange text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
          >
            {label}
            {locked && (
              <span className="text-[10px] leading-none opacity-70">🔒</span>
            )}
            {label === 'Mensajes' && unreadMensajes > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs leading-none">
                {unreadMensajes > 9 ? '9+' : unreadMensajes}
              </span>
            )}
          </Link>
        )
      })}

      <Link
        href={CONFIG_HREF}
        className={`ml-auto flex-shrink-0 p-2 rounded-lg transition-colors
          ${configActive ? 'bg-orange text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
        title="Configuración"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </Link>
    </nav>
  )
}
