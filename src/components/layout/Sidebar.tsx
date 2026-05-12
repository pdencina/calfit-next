'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const SUPER_ADMIN_NAV = [
  { href: '/dashboard/admin', icon: '⚡', label: 'Overview' },
  { href: '/dashboard/admin/academias', icon: '🏢', label: 'Academias' },
  { href: '/dashboard/admin/profes', icon: '👨‍🏫', label: 'Coaches' },
  { href: '/dashboard/admin/alumnos', icon: '👥', label: 'Alumnos' },
  { href: '/dashboard/admin/suscripciones', icon: '💳', label: 'Suscripciones' },
]

const PROFE_NAV = [
  { href: '/dashboard/profe', icon: '⚡', label: 'Dashboard' },
  { href: '/dashboard/profe/alumnos', icon: '👥', label: 'Alumnos' },
  { href: '/dashboard/profe/rutinas', icon: '📋', label: 'Rutinas' },
  { href: '/dashboard/profe/mensajes', icon: '💬', label: 'Mensajes' },
  { href: '/dashboard/profe/metricas', icon: '📊', label: 'Métricas' },
  { href: '/dashboard/profe/planes', icon: '💳', label: 'Plan' },
]

const ALUMNO_NAV = [
  { href: '/dashboard/alumno', icon: '🏠', label: 'Inicio' },
  { href: '/dashboard/alumno/rutinas', icon: '💪', label: 'Rutinas' },
  { href: '/dashboard/alumno/mensajes', icon: '💬', label: 'Mensajes' },
  { href: '/dashboard/alumno/metricas', icon: '📊', label: 'Métricas' },
  { href: '/dashboard/alumno/goals', icon: '🎯', label: 'Objetivos' },
]

interface Profile {
  role: string
  full_name?: string
  email?: string
}

export default function Sidebar({ profile }: { profile: Profile }) {
  const router = useRouter()
  const pathname = usePathname()

  const [loggingOut, setLoggingOut] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 1024)
    }

    handleResize()

    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const nav =
    profile.role === 'super_admin' || profile.role === 'admin'
      ? SUPER_ADMIN_NAV
      : profile.role === 'profe'
        ? PROFE_NAV
        : ALUMNO_NAV

  const initials = (profile.full_name || profile.email || 'Usuario')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  async function handleLogout() {
    setLoggingOut(true)

    const supabase = createClient()

    await supabase.auth.signOut()

    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* MOBILE TOP BAR */}
      {isMobile && (
        <div style={mobileTopBar}>
          <button
            onClick={() => setMobileOpen(true)}
            style={hamburgerButton}
          >
            ☰
          </button>

          <div style={mobileLogo}>
            CALFIT
          </div>
        </div>
      )}

      {/* OVERLAY */}
      {mobileOpen && isMobile && (
        <div
          onClick={() => setMobileOpen(false)}
          style={overlay}
        />
      )}

      <aside
        style={{
          ...sidebar,
          ...(isMobile
            ? mobileOpen
              ? mobileSidebarOpen
              : mobileSidebarClosed
            : {}),
        }}
      >
        {/* CLOSE BUTTON */}
        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            style={closeButton}
          >
            ✕
          </button>
        )}

        {/* LOGO */}
        <div style={logoContainer}>
          <span style={logo}>
            CALFIT
          </span>
        </div>

        {/* NAV */}
        <nav style={navStyle}>
          {nav.map((item: any, i) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href + '/')

            return (
              <a
                key={i}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  ...navItem,
                  ...(isActive ? navItemActive : {}),
                }}
              >
                <span style={navIcon}>
                  {item.icon}
                </span>

                {item.label}
              </a>
            )
          })}
        </nav>

        {/* USER */}
        <div style={userSection}>
          <div style={userInfo}>
            <div style={avatar}>
              {initials}
            </div>

            <div>
              <div style={userName}>
                {profile.full_name || profile.email}
              </div>

              <div style={userRole}>
                {profile.role}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={logoutButton}
          >
            {loggingOut ? 'Saliendo...' : 'Cerrar sesión'}
          </button>
        </div>
      </aside>

      {/* BOTTOM NAV MOBILE */}
      {isMobile && (
        <div style={bottomNav}>
          {nav.slice(0, 4).map((item: any) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href + '/')

            return (
              <a
                key={item.href}
                href={item.href}
                style={{
                  ...bottomNavItem,
                  color: isActive ? '#c8f542' : '#666',
                }}
              >
                <div style={{ fontSize: 20 }}>
                  {item.icon}
                </div>

                <div style={{ fontSize: 11 }}>
                  {item.label}
                </div>
              </a>
            )
          })}
        </div>
      )}
    </>
  )
}

/* STYLES */

const sidebar: React.CSSProperties = {
  width: 260,
  background: '#0b0b0b',
  borderRight: '1px solid rgba(255,255,255,0.06)',
  position: 'fixed',
  top: 0,
  left: 0,
  bottom: 0,
  display: 'flex',
  flexDirection: 'column',
  zIndex: 4000,
  transition: '0.25s ease',
}

const mobileSidebarOpen: React.CSSProperties = {
  transform: 'translateX(0)',
}

const mobileSidebarClosed: React.CSSProperties = {
  transform: 'translateX(-110%)',
}

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.7)',
  zIndex: 3500,
}

const logoContainer: React.CSSProperties = {
  padding: '24px',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
}

const logo: React.CSSProperties = {
  fontFamily: 'Bebas Neue',
  fontSize: 36,
  letterSpacing: 5,
  color: '#c8f542',
}

const navStyle: React.CSSProperties = {
  flex: 1,
  padding: 16,
  overflowY: 'auto',
}

const navItem: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '14px 16px',
  borderRadius: 14,
  textDecoration: 'none',
  color: '#666',
  marginBottom: 8,
  transition: '0.15s ease',
}

const navItemActive: React.CSSProperties = {
  background: 'rgba(200,245,66,0.08)',
  color: '#c8f542',
}

const navIcon: React.CSSProperties = {
  width: 24,
  textAlign: 'center',
  fontSize: 18,
}

const userSection: React.CSSProperties = {
  padding: 18,
  borderTop: '1px solid rgba(255,255,255,0.06)',
}

const userInfo: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  alignItems: 'center',
  marginBottom: 14,
}

const avatar: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: '50%',
  background: '#c8f542',
  color: '#000',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 800,
}

const userName: React.CSSProperties = {
  fontSize: 14,
  color: '#fff',
}

const userRole: React.CSSProperties = {
  fontSize: 12,
  color: '#666',
  textTransform: 'capitalize',
}

const logoutButton: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.08)',
  background: '#111',
  color: '#888',
  cursor: 'pointer',
}

const mobileTopBar: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  height: 70,
  background: 'rgba(0,0,0,0.9)',
  backdropFilter: 'blur(10px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 16px',
  zIndex: 3000,
}

const hamburgerButton: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 12,
  border: '1px solid rgba(200,245,66,0.3)',
  background: '#111',
  color: '#c8f542',
  fontSize: 22,
}

const mobileLogo: React.CSSProperties = {
  color: '#fff',
  fontWeight: 700,
  letterSpacing: 1,
}

const closeButton: React.CSSProperties = {
  position: 'absolute',
  top: 16,
  right: 16,
  width: 36,
  height: 36,
  borderRadius: 10,
  border: 'none',
  background: '#151515',
  color: '#fff',
  cursor: 'pointer',
}

const bottomNav: React.CSSProperties = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  height: 78,
  background: 'rgba(10,10,10,0.95)',
  backdropFilter: 'blur(20px)',
  borderTop: '1px solid rgba(255,255,255,0.06)',
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
  zIndex: 3000,
}

const bottomNavItem: React.CSSProperties = {
  textDecoration: 'none',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
}