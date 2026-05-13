'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function MobileBottomNav({
  role,
}: {
  role: string
}) {
  const pathname = usePathname()

  const items =
    role === 'profe'
      ? [
          {
            href: '/dashboard/profe',
            icon: '🏠',
            label: 'Inicio',
          },
          {
            href: '/dashboard/profe/rutinas',
            icon: '📋',
            label: 'Rutinas',
          },
          {
            href: '/dashboard/profe/mensajes',
            icon: '💬',
            label: 'Mensajes',
          },
          {
            href: '/dashboard/profe/plan',
            icon: '👤',
            label: 'Plan',
          },
        ]
      : [
          {
            href: '/dashboard/alumno',
            icon: '🏠',
            label: 'Inicio',
          },
          {
            href: '/dashboard/alumno/rutinas',
            icon: '💪',
            label: 'Rutinas',
          },
          {
            href: '/dashboard/alumno/mensajes',
            icon: '💬',
            label: 'Mensajes',
          },
          {
            href: '/dashboard/alumno/objetivos',
            icon: '🎯',
            label: 'Objetivos',
          },
        ]

  return (
    <nav style={styles.nav}>
      {items.map((item) => {
        const active =
          pathname === item.href

        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              ...styles.link,
              ...(active
                ? styles.active
                : {}),
            }}
          >
            <div style={styles.icon}>
              {item.icon}
            </div>

            <div style={styles.label}>
              {item.label}
            </div>
          </Link>
        )
      })}
    </nav>
  )
}

const styles: Record<
  string,
  React.CSSProperties
> = {
  nav: {
    position: 'fixed',
    bottom: 12,
    left: 12,
    right: 12,
    background: '#111',
    border:
      '1px solid rgba(255,255,255,.06)',
    borderRadius: 22,
    display: 'flex',
    justifyContent:
      'space-around',
    alignItems: 'center',
    padding: '10px 6px',
    zIndex: 9999,
    backdropFilter: 'blur(10px)',
  },

  link: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    textDecoration: 'none',
    color: '#666',
    fontSize: 11,
    fontWeight: 700,
    flex: 1,
    padding: '6px 0',
    borderRadius: 12,
  },

  active: {
    color: '#c8f542',
    background:
      'rgba(200,245,66,.08)',
  },

  icon: {
    fontSize: 18,
  },

  label: {
    fontSize: 11,
  },
}