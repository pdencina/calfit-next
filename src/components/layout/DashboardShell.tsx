'use client'

import { useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import MobileBottomNav from '@/components/layout/MobileBottomNav'

export default function DashboardShell({
  profile,
  children,
}: {
  profile: any
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="calfit-shell">
      <aside className="desktop-sidebar">
        <Sidebar profile={profile} />
      </aside>

      <header className="mobile-header">
        <button className="hamburger" onClick={() => setOpen(true)}>
          ☰
        </button>
        <span>CALFIT</span>
      </header>

      {open && (
        <div className="mobile-overlay" onClick={() => setOpen(false)} />
      )}

      <aside className={`mobile-sidebar ${open ? 'open' : ''}`}>
        <button className="close-menu" onClick={() => setOpen(false)}>
          ×
        </button>
        <Sidebar profile={profile} />
      </aside>

      <main className="calfit-main">{children}</main>

      <MobileBottomNav role={profile.role || 'alumno'} />
    </div>
  )
}