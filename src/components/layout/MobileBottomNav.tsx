'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function MobileBottomNav({ role }: { role: string }) {
  const pathname = usePathname()

  const items =
    role === 'profe'
      ? [
          { href: '/dashboard/profe', icon: '🏠', label: 'Inicio' },
          { href: '/dashboard/profe/rutinas', icon: '📋', label: 'Rutinas' },
          { href: '/dashboard/profe/mensajes', icon: '💬', label: 'Chat' },
          { href: '/dashboard/profe/planes', icon: '💳', label: 'Plan' },
        ]
      : [
          { href: '/dashboard/alumno', icon: '🏠', label: 'Inicio' },
          { href: '/dashboard/alumno/rutinas', icon: '💪', label: 'Rutinas' },
          { href: '/dashboard/alumno/mensajes', icon: '💬', label: 'Chat' },
          { href: '/dashboard/alumno/goals', icon: '🎯', label: 'Metas' },
        ]

  return (
    <nav className="mobile-bottom-nav">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/')

        return (
          <Link key={item.href} href={item.href} className={active ? 'bottom-item active' : 'bottom-item'}>
            <span>{item.icon}</span>
            <small>{item.label}</small>
          </Link>
        )
      })}
    </nav>
  )
}