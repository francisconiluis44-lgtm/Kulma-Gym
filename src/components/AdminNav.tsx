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
  { href: '/admin/configuracion', label: 'Redes' },
]

export default function AdminNav({
  unreadMensajes,
  plan,
}: {
  unreadMensajes: number
  plan: string
}) {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 overflow-x-auto">
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
    </nav>
  )
}
