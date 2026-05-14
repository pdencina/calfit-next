'use client'
import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const PROFE_NAV = [
  { href: '/dashboard/profe',          icon: '⚡', label: 'Dashboard' },
  { href: '/dashboard/profe/alumnos',  icon: '👥', label: 'Mis Alumnos' },
  { href: '/dashboard/profe/rutinas',  icon: '📋', label: 'Rutinas' },
  { href: '/dashboard/profe/mensajes', icon: '💬', label: 'Mensajes' },
  { section: 'Seguimiento' },
  { href: '/dashboard/profe/metricas', icon: '📊', label: 'Métricas' },
  { href: '/dashboard/profe/progreso', icon: '📈', label: 'Progreso' },
  { section: 'Negocio' },
  { href: '/dashboard/profe/admin',    icon: '🏛', label: 'Administración' },
  { href: '/dashboard/profe/planes',   icon: '💳', label: 'Mi Plan' },
]

const ALUMNO_NAV = [
  { href: '/dashboard/alumno',             icon: '🏠', label: 'Inicio' },
  { href: '/dashboard/alumno/rutinas',     icon: '💪', label: 'Mis Rutinas' },
  { href: '/dashboard/alumno/mensajes',    icon: '💬', label: 'Mensajes' },
  { section: 'Mi progreso' },
  { href: '/dashboard/alumno/metricas',    icon: '📊', label: 'Métricas' },
  { href: '/dashboard/alumno/historial',   icon: '📆', label: 'Historial' },
  { href: '/dashboard/alumno/goals',       icon: '🎯', label: 'Objetivos' },
]

const ADMIN_NAV = [
  { href: '/dashboard/admin',          icon: '⚡', label: 'Overview' },
  { href: '/dashboard/admin/profes',   icon: '👨‍🏫', label: 'Profesores' },
  { href: '/dashboard/admin/usuarios', icon: '👥', label: 'Usuarios' },
]

interface Profile {
  role: string
  full_name: string
}

export default function Sidebar({ profile }: { profile: Profile }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [loggingOut, setLoggingOut] = useState(false)

  const nav = profile.role === 'admin' ? ADMIN_NAV
            : profile.role === 'profe' ? PROFE_NAV
            : ALUMNO_NAV

  const initials = profile.full_name
    ?.split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase() || '??'

  async function handleLogout() {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside style={{
      width: 'var(--sidebar-w)',
      background: '#0e0e0e',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      position: 'fixed', top: 0, left: 0, bottom: 0,
      display: 'flex', flexDirection: 'column',
      zIndex: 100,
    }}>
      {/* Brand */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 26, letterSpacing: 4, color: '#c8f542' }}>
          CALFIT
        </span>
        {profile.role === 'admin' && (
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(251,191,36,0.1)', color: '#fbbf24', marginLeft: 8, letterSpacing: 1 }}>
            ADMIN
          </span>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {nav.map((item: any, i) => {
          if (item.section) return (
            <div key={i} style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#444', padding: '10px 20px 4px' }}>
              {item.section}
            </div>
          )
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <a key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 20px', fontSize: 13,
              color: isActive ? '#c8f542' : '#666',
              borderLeft: `2px solid ${isActive ? '#c8f542' : 'transparent'}`,
              background: isActive ? 'rgba(200,245,66,0.05)' : 'transparent',
              textDecoration: 'none', transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </a>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#c8f542', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#070707', flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile.full_name}
            </div>
            <div style={{ fontSize: 11, color: '#555', textTransform: 'capitalize' }}>{profile.role}</div>
          </div>
        </div>
        <button onClick={handleLogout} disabled={loggingOut}
          style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#555', fontSize: 12, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s' }}>
          {loggingOut ? 'Saliendo...' : 'Cerrar sesión'}
        </button>
      </div>
    </aside>
  )
}
