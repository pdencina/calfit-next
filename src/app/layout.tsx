import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CALFIT PRO — Plataforma de Calistenia',
  description: 'La plataforma todo-en-uno para entrenadores de calistenia.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
