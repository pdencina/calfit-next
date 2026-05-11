import Link from 'next/link'

export default function AlumnoDashboardPage() {
  return (
    <div style={{ padding: 32, color: '#fff' }}>
      <h1 style={{ fontSize: 36, margin: 0 }}>Mi Entrenamiento</h1>
      <p style={{ color: '#888' }}>Revisa tus rutinas y registra tu progreso.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginTop: 24 }}>
        <Link href="/dashboard/alumno/rutinas" style={card}>💪 Ver mis rutinas</Link>
        <Link href="/dashboard/alumno/historial" style={card}>📆 Historial</Link>
        <Link href="/dashboard/alumno/metricas" style={card}>📊 Métricas</Link>
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
