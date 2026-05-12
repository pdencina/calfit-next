'use client'

import { useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'

export default function DashboardShell({
  profile,
  children,
}: {
  profile: any
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="app-shell">
      <button
        className="mobile-menu-button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
      >
        ☰
      </button>

      <div
        className={`sidebar-mobile-overlay ${open ? 'show' : ''}`}
        onClick={() => setOpen(false)}
      />

      <aside className={`sidebar-mobile ${open ? 'open' : ''}`}>
        <button
          className="mobile-close-button"
          onClick={() => setOpen(false)}
          aria-label="Cerrar menú"
        >
          ×
        </button>

        <div onClick={() => setOpen(false)}>
          <Sidebar profile={profile} />
        </div>
      </aside>

      <aside className="sidebar-desktop">
        <Sidebar profile={profile} />
      </aside>

      <main className="main-content">{children}</main>
    </div>
  )
}