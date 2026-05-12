'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Profile = {
  id: string
  full_name: string | null
  role: string | null
}

type Routine = {
  id: string
  titulo: string | null
}

type Session = {
  id: string
  completed: boolean
  duration_minutes: number
  created_at: string
}

type Goal = {
  id: string
  completed: boolean
}

export default function ProfeDashboardPage() {
  const supabase = createClient()

  const [loading, setLoading] =
    useState(true)

  const [teacherName, setTeacherName] =
    useState('Coach')

  const [students, setStudents] =
    useState<Profile[]>([])

  const [routines, setRoutines] =
    useState<Routine[]>([])

  const [sessions, setSessions] =
    useState<Session[]>([])

  const [goals, setGoals] = useState<
    Goal[]
  >([])

  async function loadDashboard() {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/login'
      return
    }

    const { data: profile } =
      await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (profile?.full_name) {
      setTeacherName(profile.full_name)
    }

    const { data: studentRows } =
      await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'alumno')

    setStudents(studentRows || [])

    const { data: routineRows } =
      await supabase
        .from('routines')
        .select('*')
        .order('created_at', {
          ascending: false,
        })

    setRoutines(routineRows || [])

    const { data: sessionRows } =
      await supabase
        .from('workout_sessions')
        .select('*')
        .order('created_at', {
          ascending: false,
        })

    setSessions(sessionRows || [])

    const { data: goalRows } =
      await supabase
        .from('student_goals')
        .select('*')

    setGoals(goalRows || [])

    setLoading(false)
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const completedSessions =
    sessions.filter((s) => s.completed)
      .length

  const totalMinutes = sessions.reduce(
    (acc, s) =>
      acc + (s.duration_minutes || 0),
    0
  )

  const completedGoals =
    goals.filter((g) => g.completed)
      .length

  const sessionsThisWeek = useMemo(() => {
    const now = new Date()

    return sessions.filter((s) => {
      const sessionDate = new Date(
        s.created_at
      )

      const diff =
        now.getTime() -
        sessionDate.getTime()

      const days =
        diff /
        (1000 * 60 * 60 * 24)

      return days <= 7
    }).length
  }, [sessions])

  if (loading) {
    return (
      <div style={styles.page}>
        Cargando dashboard...
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <div>
          <h1 style={styles.title}>
            Hola {teacherName} 👋
          </h1>

          <p style={styles.subtitle}>
            Administra tus alumnos y
            monitorea el progreso de tu
            academia.
          </p>
        </div>

        <div style={styles.liveCard}>
          🔥 {sessionsThisWeek} sesiones
          esta semana
        </div>
      </div>

      <div style={styles.statsGrid}>
        <StatCard
          value={students.length}
          label="Alumnos activos"
        />

        <StatCard
          value={routines.length}
          label="Rutinas creadas"
        />

        <StatCard
          value={completedSessions}
          label="Sesiones completadas"
        />

        <StatCard
          value={completedGoals}
          label="Objetivos logrados"
        />
      </div>

      <div style={styles.quickGrid}>
        <QuickCard
          href="/dashboard/profe/rutinas"
          emoji="📋"
          title="Rutinas"
          text="Crea y asigna entrenamientos."
        />

        <QuickCard
          href="/dashboard/profe/alumnos"
          emoji="👥"
          title="Alumnos"
          text="Gestiona tu comunidad."
        />

        <QuickCard
          href="/dashboard/profe/mensajes"
          emoji="💬"
          title="Mensajes"
          text="Habla con tus alumnos."
        />
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTop}>
          <h2 style={styles.sectionTitle}>
            Actividad reciente
          </h2>

          <button
            style={styles.refresh}
            onClick={loadDashboard}
          >
            Actualizar
          </button>
        </div>

        {sessions.length === 0 ? (
          <div style={styles.empty}>
            Aún no hay actividad.
          </div>
        ) : (
          <div style={styles.activityList}>
            {sessions
              .slice(0, 8)
              .map((session) => (
                <div
                  key={session.id}
                  style={
                    styles.activityCard
                  }
                >
                  <div>
                    <strong
                      style={
                        styles.activityTitle
                      }
                    >
                      {session.completed
                        ? '✅ Entrenamiento completado'
                        : '⏳ Entrenamiento iniciado'}
                    </strong>

                    <p
                      style={
                        styles.activityDate
                      }
                    >
                      {new Date(
                        session.created_at
                      ).toLocaleDateString(
                        'es-CL'
                      )}
                    </p>
                  </div>

                  <div
                    style={
                      styles.badge
                    }
                  >
                    ⏱️{' '}
                    {
                      session.duration_minutes
                    }{' '}
                    min
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <div style={styles.bottomGrid}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            Resumen rápido
          </h2>

          <div style={styles.summaryGrid}>
            <SummaryItem
              label="Minutos entrenados"
              value={String(
                totalMinutes
              )}
            />

            <SummaryItem
              label="Promedio por sesión"
              value={
                completedSessions > 0
                  ? String(
                      Math.round(
                        totalMinutes /
                          completedSessions
                      )
                    )
                  : '0'
              }
            />

            <SummaryItem
              label="Objetivos activos"
              value={String(
                goals.length
              )}
            />

            <SummaryItem
              label="Nivel academia"
              value="PRO"
            />
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            Últimas rutinas
          </h2>

          {routines.length === 0 ? (
            <div style={styles.empty}>
              No hay rutinas.
            </div>
          ) : (
            <div style={styles.routineList}>
              {routines
                .slice(0, 6)
                .map((routine) => (
                  <div
                    key={routine.id}
                    style={
                      styles.routineCard
                    }
                  >
                    <span
                      style={
                        styles.routineTitle
                      }
                    >
                      💪{' '}
                      {
                        routine.titulo
                      }
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  value,
  label,
}: {
  value: number
  label: string
}) {
  return (
    <div style={styles.statCard}>
      <span style={styles.statNumber}>
        {value}
      </span>

      <span style={styles.statLabel}>
        {label}
      </span>
    </div>
  )
}

function QuickCard({
  href,
  emoji,
  title,
  text,
}: {
  href: string
  emoji: string
  title: string
  text: string
}) {
  return (
    <Link href={href} style={styles.quickCard}>
      <div style={styles.quickEmoji}>
        {emoji}
      </div>

      <h2 style={styles.quickTitle}>
        {title}
      </h2>

      <p style={styles.quickText}>
        {text}
      </p>
    </Link>
  )
}

function SummaryItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div style={styles.summaryItem}>
      <strong style={styles.summaryValue}>
        {value}
      </strong>

      <span style={styles.summaryLabel}>
        {label}
      </span>
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

  liveCard: {
    background:
      'linear-gradient(135deg,#c8f542,#9eff00)',
    color: '#000',
    padding: '18px 24px',
    borderRadius: 18,
    fontWeight: 900,
    fontSize: 18,
    whiteSpace: 'nowrap',
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
    color: '#8a8a8a',
    marginTop: 10,
    display: 'block',
  },

  quickGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit,minmax(240px,1fr))',
    gap: 20,
    marginBottom: 30,
  },

  quickCard: {
    display: 'block',
    background: '#111',
    border:
      '1px solid rgba(255,255,255,.06)',
    borderRadius: 24,
    padding: 24,
    textDecoration: 'none',
    color: '#fff',
  },

  quickEmoji: {
    fontSize: 42,
    marginBottom: 14,
  },

  quickTitle: {
    color: '#c8f542',
    marginBottom: 10,
  },

  quickText: {
    color: '#8a8a8a',
    lineHeight: 1.5,
  },

  section: {
    background: '#111',
    border:
      '1px solid rgba(255,255,255,.06)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },

  sectionTop: {
    display: 'flex',
    justifyContent:
      'space-between',
    alignItems: 'center',
    marginBottom: 20,
    gap: 20,
  },

  sectionTitle: {
    margin: 0,
    fontSize: 28,
  },

  refresh: {
    border:
      '1px solid rgba(200,245,66,.4)',
    background: 'transparent',
    color: '#c8f542',
    padding: '10px 14px',
    borderRadius: 12,
    cursor: 'pointer',
  },

  empty: {
    color: '#8a8a8a',
    padding: 20,
  },

  activityList: {
    display: 'grid',
    gap: 14,
  },

  activityCard: {
    background: '#0a0a0a',
    border:
      '1px solid rgba(255,255,255,.06)',
    borderRadius: 18,
    padding: 18,
    display: 'flex',
    justifyContent:
      'space-between',
    alignItems: 'center',
    gap: 20,
  },

  activityTitle: {
    color: '#fff',
  },

  activityDate: {
    color: '#8a8a8a',
    marginTop: 8,
  },

  badge: {
    background: '#1b1b1b',
    color: '#c8f542',
    padding: '10px 14px',
    borderRadius: 14,
    fontWeight: 800,
    whiteSpace: 'nowrap',
  },

  bottomGrid: {
    display: 'grid',
    gridTemplateColumns:
      '1fr 1fr',
    gap: 24,
  },

  summaryGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(2,1fr)',
    gap: 14,
  },

  summaryItem: {
    background: '#0a0a0a',
    border:
      '1px solid rgba(255,255,255,.06)',
    borderRadius: 18,
    padding: 18,
  },

  summaryValue: {
    display: 'block',
    color: '#c8f542',
    fontSize: 32,
  },

  summaryLabel: {
    color: '#8a8a8a',
    marginTop: 8,
    display: 'block',
  },

  routineList: {
    display: 'grid',
    gap: 12,
  },

  routineCard: {
    background: '#0a0a0a',
    border:
      '1px solid rgba(255,255,255,.06)',
    borderRadius: 16,
    padding: 16,
  },

  routineTitle: {
    color: '#fff',
    fontWeight: 700,
  },
}