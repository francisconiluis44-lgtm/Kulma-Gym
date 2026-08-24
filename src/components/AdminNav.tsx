'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { canUse } from '@/lib/plan-features'

const ALL_LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/alumnos', label: 'Alumnos' },
  { href: '/admin/membresias', label: 'Membresías' },
  { href: '/admin/cobros', label: 'Cobros', ownerOnly: true },
  { href: '/admin/asistencias', label: 'Asistencias', feature: 'asistencias' },
  { href: '/admin/clases', label: 'Clases', feature: 'clases' },
  { href: '/admin/comunicados', label: 'Comunicados' },
  { href: '/admin/mensajes', label: 'Mensajes' },
  { href: '/admin/ia', label: 'IA' },
  { href: '/admin/importar', label: 'Importar' },
  { href: '/admin/colaboradores', label: 'Colaboradores', ownerOnly: true },
]

function LockIcon() {
  return (
    <svg
      className="w-3 h-3 shrink-0 opacity-50"
      fill="none"
      viewBox="0 0 16 16"
      aria-hidden="true"
    >
      <rect x="3" y="7" width="10" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export default function AdminNav({
  unreadMensajes,
  plan,
  rol,
}: {
  unreadMensajes: number
  plan: string
  rol: 'owner' | 'colaborador'
}) {
  const pathname = usePathname()

  const links = ALL_LINKS.filter((l) => !l.ownerOnly || rol === 'owner')

  return (
    <>
      <style>{`
        .admin-nav::-webkit-scrollbar {
          height: 3px;
        }
        .admin-nav::-webkit-scrollbar-track {
          background: transparent;
          margin: 0 6px;
        }
        .admin-nav::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0);
          border-radius: 9999px;
          transition: background-color 0.2s ease;
        }
        .admin-nav:hover::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.25);
        }
        .admin-nav::-webkit-scrollbar-thumb:hover {
          background-color: var(--color-orange, #fb923c);
        }
      `}</style>
      <nav
        className="admin-nav flex gap-1 overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}
      >
        {links.map(({ href, label, feature }) => {
          const active =
            href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(href)
          const locked = feature ? !canUse(plan, feature) : false
          const isMensajesConBadge = label === 'Mensajes' && unreadMensajes > 0
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold font-body transition-all duration-150 whitespace-nowrap shrink-0
                ${active ? 'bg-orange text-white shadow-sm' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
            >
              {isMensajesConBadge ? (
                <>
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold leading-none px-1">
                    {unreadMensajes > 9 ? '9+' : unreadMensajes}
                  </span>
                  Msj
                </>
              ) : label}
              {locked && <LockIcon />}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
