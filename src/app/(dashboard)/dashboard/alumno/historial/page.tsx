'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type WorkoutSession = {
  id: string
  completed: boolean
  duration_minutes: number
  notes: string | null
  created_at: string

  routines: {
    titulo: string | null
    descripcion: string | null
  } | null
}

export default function HistorialPage() {
  const supabase = createClient()

  const [loading, setLoading] =
    useState(true)

  const [sessions, setSessions] =
    useState<WorkoutSession[]>([])

  const [message, setMessage] =
    useState('')

  async function loadData() {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/login'
      return
    }

    const { data, error } =
      await supabase
        .from('workout_sessions')
        .select(`
          *,
          routines (
            titulo,
            descripcion
          )
        `)
        .eq('student_id', user.id)
        .order('created_at', {
          ascending: false,
        })

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

  const totalMinutes = useMemo(() => {
    return sessions.reduce(
      (acc, s) =>
        acc +
        (s.duration_minutes || 0),
      0
    )
  }, [sessions])

  const totalSessions =
    sessions.length

  if (loading) {
    return (
      <div style={styles.page}>
        Cargando historial...
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <div>
          <h1 style={styles.title}>
            Historial
          </h1>

          <p style={styles.subtitle}>
            Todas tus sesiones y
            entrenamientos completados.
          </p>
        </div>

        <button
          style={styles.refresh}
          onClick={loadData}
        >
          Actualizar
        </button>
      </div>

      {message && (
        <div style={styles.notice}>
          {message}
        </div>
      )}

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span style={styles.statNumber}>
            {totalSessions}
          </span>

          <span style={styles.statLabel}>
            Sesiones
          </span>
        </div>

        <div style={styles.statCard}>
          <span style={styles.statNumber}>
            {totalMinutes}
          </span>

          <span style={styles.statLabel}>
            Minutos
          </span>
        </div>

        <div style={styles.statCard}>
          <span style={styles.statNumber}>
            🔥
          </span>

          <span style={styles.statLabel}>
            Sigue constante
          </span>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div style={styles.empty}>
          Aún no tienes sesiones
          registradas.
        </div>
      ) : (
        <div style={styles.list}>
          {sessions.map((s) => (
            <div
              key={s.id}
              style={styles.card}
            >
              <div style={styles.cardTop}>
                <div>
                  <h2 style={styles.cardTitle}>
                    {s.routines
                      ?.titulo ||
                      'Entrenamiento'}
                  </h2>

                  <p
                    style={
                      styles.cardDesc
                    }
                  >
                    {s.routines
                      ?.descripcion ||
                      'Sin descripción'}
                  </p>
                </div>

                <div
                  style={
                    styles.badge
                  }
                >
                  {s.completed
                    ? '✅ Completado'
                    : '⏳ En progreso'}
                </div>
              </div>

              <div style={styles.meta}>
                <div>
                  📅{' '}
                  {new Date(
                    s.created_at
                  ).toLocaleDateString()}
                </div>

                <div>
                  ⏱️{' '}
                  {
                    s.duration_minutes
                  }{' '}
                  min
                </div>
              </div>

              {s.notes && (
                <div
                  style={
                    styles.notes
                  }
                >
                  <strong>
                    Notas:
                  </strong>

                  <p
                    style={{
                      marginTop: 8,
                    }}
                  >
                    {s.notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles: Record<
  string,
  React.CSSProperties
> = {
  page: {
    padding: 32,
    color: '#fff',
  },

  hero: {
    display: 'flex',
    justifyContent:
      'space-between',
    alignItems: 'center',
    gap: 20,
    marginBottom: 30,
  },

  title: {
    fontSize: 42,
    margin: 0,
    fontWeight: 900,
  },

  subtitle: {
    color: '#8a8a8a',
    marginTop: 10,
  },

  refresh: {
    border:
      '1px solid rgba(200,245,66,.4)',
    background: 'transparent',
    color: '#c8f542',
    padding: '12px 18px',
    borderRadius: 14,
    cursor: 'pointer',
  },

  notice: {
    background:
      'rgba(200,245,66,.08)',
    border:
      '1px solid rgba(200,245,66,.25)',
    color: '#c8f542',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit,minmax(220px,1fr))',
    gap: 20,
    marginBottom: 30,
  },

  statCard: {
    background: '#111',
    border:
      '1px solid rgba(255,255,255,.06)',
    borderRadius: 24,
    padding: 24,
  },

  statNumber: {
    fontSize: 42,
    color: '#c8f542',
    fontWeight: 900,
    display: 'block',
  },

  statLabel: {
    marginTop: 10,
    color: '#8a8a8a',
    display: 'block',
  },

  empty: {
    background: '#111',
    border:
      '1px solid rgba(255,255,255,.06)',
    borderRadius: 24,
    padding: 40,
    color: '#8a8a8a',
    textAlign: 'center',
  },

  list: {
    display: 'grid',
    gap: 20,
  },

  card: {
    background: '#111',
    border:
      '1px solid rgba(255,255,255,.06)',
    borderRadius: 24,
    padding: 24,
  },

  cardTop: {
    display: 'flex',
    justifyContent:
      'space-between',
    gap: 20,
    alignItems: 'center',
  },

  cardTitle: {
    color: '#c8f542',
    marginBottom: 10,
  },

  cardDesc: {
    color: '#8a8a8a',
  },

  badge: {
    background:
      'linear-gradient(135deg,#c8f542,#9eff00)',
    color: '#000',
    padding: '10px 14px',
    borderRadius: 14,
    fontWeight: 800,
    whiteSpace: 'nowrap',
  },

  meta: {
    display: 'flex',
    gap: 20,
    marginTop: 20,
    color: '#ddd',
    flexWrap: 'wrap',
  },

  notes: {
    marginTop: 20,
    background: '#0a0a0a',
    border:
      '1px solid rgba(255,255,255,.06)',
    borderRadius: 16,
    padding: 18,
    color: '#ddd',
  },
}