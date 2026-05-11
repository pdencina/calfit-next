import Link from 'next/link'

export default function ProfeDashboardPage() {
  return (
    <div style={{ padding: 32, color: '#fff' }}>
      <h1 style={{ fontSize: 36, margin: 0 }}>Panel del Profe</h1>
      <p style={{ color: '#888' }}>Gestiona alumnos, rutinas y progreso.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginTop: 24 }}>
        <Link href="/dashboard/profe/rutinas" style={card}>📋 Crear y asignar rutinas</Link>
        <Link href="/dashboard/profe/alumnos" style={card}>👥 Ver alumnos</Link>
        <Link href="/dashboard/profe/mensajes" style={card}>💬 Mensajes</Link>
      </div>
    </div>
  )
}

const card = {
  display: 'block',
  background: '#111',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 20,
  padding: 24,
  color: '#c8f542',
  textDecoration: 'none',
  fontWeight: 800,
}
