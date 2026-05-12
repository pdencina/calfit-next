'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type WorkoutSession = {
  id: string
  completed: boolean
  duration_minutes: number
  created_at: string
  routines: {
    titulo: string | null
  } | null
}

export default function MetricasPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [message, setMessage] = useState('')

  async function loadData() {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/login'
      return
    }

    const { data, error } = await supabase
      .from('workout_sessions')
      .select(`
        *,
        routines (
          titulo
        )
      `)
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    setSessions(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const completed = sessions.filter(s => s.completed).length

  const totalMinutes = sessions.reduce(
    (acc, s) => acc + (s.duration_minutes || 0),
    0
  )

  const averageMinutes = completed > 0
    ? Math.round(totalMinutes / completed)
    : 0

  const last7Days = useMemo(() => {
    const today = new Date()

    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(today)
      date.setDate(today.getDate() - (6 - index))

      const daySessions = sessions.filter(s => {
        const sessionDate = new Date(s.created_at)
        return sessionDate.toDateString() === date.toDateString()
      })

      return {
        label: date.toLocaleDateString('es-CL', { weekday: 'short' }),
        count: daySessions.length,
      }
    })
  }, [sessions])

  const maxCount = Math.max(...last7Days.map(d => d.count), 1)

  if (loading) {
    return <div style={styles.page}>Cargando métricas...</div>
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Métricas</h1>
          <p style={styles.subtitle}>Visualiza tu constancia y progreso.</p>
        </div>

        <button style={styles.refresh} onClick={loadData}>
          Actualizar
        </button>
      </div>

      {message && <div style={styles.notice}>{message}</div>}

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span style={styles.statNumber}>{completed}</span>
          <span style={styles.statLabel}>Entrenamientos completados</span>
        </div>

        <div style={styles.statCard}>
          <span style={styles.statNumber}>{totalMinutes}</span>
          <span style={styles.statLabel}>Minutos entrenados</span>
        </div>

        <div style={styles.statCard}>
          <span style={styles.statNumber}>{averageMinutes}</span>
          <span style={styles.statLabel}>Promedio por sesión</span>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Actividad últimos 7 días</h2>

        <div style={styles.chart}>
          {last7Days.map(day => (
            <div key={day.label} style={styles.barItem}>
              <div style={styles.barWrap}>
                <div
                  style={{
                    ...styles.bar,
                    height: `${Math.max((day.count / maxCount) * 160, day.count ? 20 : 6)}px`,
                  }}
                />
              </div>

              <span style={styles.dayLabel}>{day.label}</span>
              <span style={styles.dayCount}>{day.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Últimos entrenamientos</h2>

        {sessions.length === 0 ? (
          <p style={styles.empty}>Aún no tienes entrenamientos registrados.</p>
        ) : (
          <div style={styles.list}>
            {sessions.slice(0, 6).map(session => (
              <div key={session.id} style={styles.sessionRow}>
                <div>
                  <strong style={styles.sessionTitle}>
                    {session.routines?.titulo || 'Entrenamiento'}
                  </strong>

                  <p style={styles.sessionDate}>
                    {new Date(session.created_at).toLocaleDateString('es-CL')}
                  </p>
                </div>

                <span style={styles.badge}>
                  {session.duration_minutes || 0} min
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: 32,
    color: '#fff',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    gap: 20,
  },

  title: {
    fontSize: 42,
    fontWeight: 900,
    margin: 0,
  },

  subtitle: {
    color: '#8a8a8a',
    marginTop: 8,
  },

  refresh: {
    border: '1px solid rgba(200,245,66,.4)',
    background: 'transparent',
    color: '#c8f542',
    padding: '12px 18px',
    borderRadius: 14,
    cursor: 'pointer',
  },

  notice: {
    background: 'rgba(200,245,66,.08)',
    border: '1px solid rgba(200,245,66,.25)',
    color: '#c8f542',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
    gap: 20,
    marginBottom: 24,
  },

  statCard: {
    background: '#111',
    border: '1px solid rgba(255,255,255,.06)',
    borderRadius: 24,
    padding: 24,
  },

  statNumber: {
    fontSize: 44,
    color: '#c8f542',
    fontWeight: 900,
    display: 'block',
  },

  statLabel: {
    color: '#8a8a8a',
    marginTop: 10,
    display: 'block',
  },

  card: {
    background: '#111',
    border: '1px solid rgba(255,255,255,.06)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 26,
    marginTop: 0,
    marginBottom: 24,
  },

  chart: {
    display: 'flex',
    alignItems: 'end',
    gap: 18,
    minHeight: 210,
  },

  barItem: {
    flex: 1,
    textAlign: 'center',
  },

  barWrap: {
    height: 170,
    display: 'flex',
    alignItems: 'end',
    justifyContent: 'center',
    background: '#0a0a0a',
    borderRadius: 14,
    padding: 8,
  },

  bar: {
    width: '100%',
    borderRadius: 10,
    background: 'linear-gradient(180deg,#c8f542,#7fbf00)',
  },

  dayLabel: {
    display: 'block',
    color: '#8a8a8a',
    marginTop: 10,
    textTransform: 'capitalize',
  },

  dayCount: {
    display: 'block',
    color: '#c8f542',
    fontWeight: 900,
    marginTop: 4,
  },

  list: {
    display: 'grid',
    gap: 12,
  },

  sessionRow: {
    background: '#0a0a0a',
    border: '1px solid rgba(255,255,255,.06)',
    borderRadius: 18,
    padding: 18,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },

  sessionTitle: {
    color: '#fff',
  },

  sessionDate: {
    color: '#8a8a8a',
    marginTop: 6,
    marginBottom: 0,
  },

  badge: {
    background: '#c8f542',
    color: '#000',
    borderRadius: 999,
    padding: '8px 12px',
    fontWeight: 900,
    whiteSpace: 'nowrap',
  },

  empty: {
    color: '#8a8a8a',
  },
}