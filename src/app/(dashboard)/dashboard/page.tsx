import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#000',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#111',
          border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 24,
          padding: 28,
          textAlign: 'center',
        }}
      >
        <h1 style={{ color: '#c8f542', marginBottom: 10 }}>CALFIT</h1>
        <p style={{ color: '#888', marginBottom: 24 }}>
          Selecciona tu panel
        </p>

        <div style={{ display: 'grid', gap: 12 }}>
          <Link href="/dashboard/profe" style={btn}>
            Panel Coach
          </Link>

          <Link href="/dashboard/alumno" style={btn}>
            Panel Alumno
          </Link>

          <Link href="/dashboard/admin" style={btnGhost}>
            Panel Admin
          </Link>
        </div>
      </div>
    </div>
  )
}

const btn = {
  background: '#c8f542',
  color: '#000',
  padding: 14,
  borderRadius: 14,
  textDecoration: 'none',
  fontWeight: 900,
}

const btnGhost = {
  background: '#181818',
  color: '#c8f542',
  padding: 14,
  borderRadius: 14,
  textDecoration: 'none',
  fontWeight: 900,
}