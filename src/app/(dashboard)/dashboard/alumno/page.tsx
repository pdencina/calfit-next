import Link from 'next/link'

export default function AlumnoDashboardPage() {
  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div>
          <p style={styles.kicker}>MI ENTRENAMIENTO</p>
          <h1 style={styles.title}>Hola 👋</h1>
          <p style={styles.subtitle}>
            Revisa tus rutinas, registra tu progreso y mantente activo.
          </p>
        </div>
      </section>

      <section style={styles.statsGrid}>
        <Card number="0" label="Rutinas activas" />
        <Card number="0" label="Completadas" />
        <Card number="0%" label="Consistencia" />
        <Card number="0" label="Minutos" />
      </section>

      <section style={styles.actionsGrid}>
        <Action href="/dashboard/alumno/rutinas" icon="💪" title="Mis rutinas" />
        <Action href="/dashboard/alumno/historial" icon="📆" title="Historial" />
        <Action href="/dashboard/alumno/metricas" icon="📊" title="Métricas" />
        <Action href="/dashboard/alumno/goals" icon="🎯" title="Objetivos" />
      </section>

      <section style={styles.emptyCard}>
        <div style={styles.emptyIcon}>💪</div>
        <h2 style={styles.emptyTitle}>Sin rutinas aún</h2>
        <p style={styles.emptyText}>
          Tu coach aún no te asignó rutinas. Cuando lo haga, aparecerán aquí.
        </p>
      </section>
    </div>
  )
}

function Card({ number, label }: { number: string; label: string }) {
  return (
    <div style={styles.statCard}>
      <strong style={styles.statNumber}>{number}</strong>
      <span style={styles.statLabel}>{label}</span>
    </div>
  )
}

function Action({
  href,
  icon,
  title,
}: {
  href: string
  icon: string
  title: string
}) {
  return (
    <Link href={href} style={styles.actionCard}>
      <span style={styles.actionIcon}>{icon}</span>
      <strong style={styles.actionTitle}>{title}</strong>
    </Link>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    width: '100%',
    maxWidth: 980,
    margin: '0 auto',
    padding: '12px 0 120px',
    color: '#fff',
  },

  hero: {
    marginBottom: 22,
  },

  kicker: {
    color: '#c8f542',
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: 900,
    marginBottom: 10,
  },

  title: {
    fontSize: 42,
    lineHeight: 1,
    margin: 0,
    fontWeight: 900,
  },

  subtitle: {
    color: '#8a8a8a',
    marginTop: 10,
    lineHeight: 1.45,
    maxWidth: 440,
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 12,
    marginBottom: 18,
  },

  statCard: {
    background: '#111',
    border: '1px solid rgba(255,255,255,.06)',
    borderRadius: 20,
    padding: 18,
    minHeight: 108,
  },

  statNumber: {
    display: 'block',
    color: '#c8f542',
    fontSize: 36,
    lineHeight: 1,
    fontWeight: 900,
  },

  statLabel: {
    display: 'block',
    color: '#888',
    fontSize: 13,
    marginTop: 10,
  },

  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 12,
    marginBottom: 18,
  },

  actionCard: {
    background: '#111',
    border: '1px solid rgba(255,255,255,.06)',
    borderRadius: 20,
    padding: 18,
    textDecoration: 'none',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    minHeight: 110,
    justifyContent: 'center',
  },

  actionIcon: {
    fontSize: 24,
  },

  actionTitle: {
    color: '#c8f542',
    fontSize: 13,
    textAlign: 'center',
  },

  emptyCard: {
    background: '#111',
    border: '1px solid rgba(255,255,255,.06)',
    borderRadius: 24,
    padding: 32,
    textAlign: 'center',
    minHeight: 220,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyIcon: {
    fontSize: 42,
    marginBottom: 14,
    opacity: 0.5,
  },

  emptyTitle: {
    margin: 0,
    fontSize: 24,
    color: '#fff',
  },

  emptyText: {
    color: '#777',
    marginTop: 10,
    maxWidth: 420,
    lineHeight: 1.5,
  },
}