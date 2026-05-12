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

  const [goals, setGoals] =
    useState<Goal[]>([])

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
      <div style={styles.loader}>
        Cargando dashboard...
      </div>
    )
  }

  return (
    <div style={styles.page}>
      {/* HERO */}

      <div style={styles.hero}>
        <div>
          <h1 style={styles.title}>
            Hola {teacherName} 👋
          </h1>

          <p style={styles.subtitle}>
            Administra tus alumnos y
            monitorea tu academia.
          </p>
        </div>

        <div style={styles.liveCard}>
          🔥 {sessionsThisWeek} sesiones
        </div>
      </div>

      {/* STATS */}

      <div style={styles.statsGrid}>
        <StatCard
          value={students.length}
          label="Alumnos"
        />

        <StatCard
          value={routines.length}
          label="Rutinas"
        />

        <StatCard
          value={completedSessions}
          label="Sesiones"
        />

        <StatCard
          value={completedGoals}
          label="Objetivos"
        />
      </div>

      {/* ACTIONS */}

      <div style={styles.quickGrid}>
        <QuickCard
          href="/dashboard/profe/rutinas"
          emoji="📋"
          title="Rutinas"
        />

        <QuickCard
          href="/dashboard/profe/alumnos"
          emoji="👥"
          title="Alumnos"
        />

        <QuickCard
          href="/dashboard/profe/mensajes"
          emoji="💬"
          title="Mensajes"
        />
      </div>

      {/* ACTIVITY */}

      <div style={styles.section}>
        <div style={styles.sectionTop}>
          <h2 style={styles.sectionTitle}>
            Actividad
          </h2>

          <button
            style={styles.refresh}
            onClick={loadDashboard}
          >
            Actualizar
          </button>
        </div>

        <div style={styles.activityList}>
          {sessions
            .slice(0, 5)
            .map((session) => (
              <div
                key={session.id}
                style={styles.activityCard}
              >
                <div>
                  <strong>
                    {session.completed
                      ? '✅ Completado'
                      : '⏳ Progreso'}
                  </strong>

                  <p style={styles.activityDate}>
                    {new Date(
                      session.created_at
                    ).toLocaleDateString(
                      'es-CL'
                    )}
                  </p>
                </div>

                <div style={styles.badge}>
                  {session.duration_minutes}
                  m
                </div>
              </div>
            ))}
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
      <div style={styles.statNumber}>
        {value}
      </div>

      <div style={styles.statLabel}>
        {label}
      </div>
    </div>
  )
}

function QuickCard({
  href,
  emoji,
  title,
}: {
  href: string
  emoji: string
  title: string
}) {
  return (
    <Link href={href} style={styles.quickCard}>
      <div style={styles.quickEmoji}>
        {emoji}
      </div>

      <div style={styles.quickTitle}>
        {title}
      </div>
    </Link>
  )
}

const styles: Record<
  string,
  React.CSSProperties
> = {
  loader: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
  },

  page: {
    padding: '24px 16px 120px',
    color: '#fff',
    width: '100%',
  },

  hero: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    marginBottom: 22,
  },

  title: {
    fontSize: 42,
    fontWeight: 900,
    lineHeight: 1,
    margin: 0,
  },

  subtitle: {
    color: '#8a8a8a',
    marginTop: 8,
    lineHeight: 1.4,
    fontSize: 15,
  },

  liveCard: {
    background:
      'linear-gradient(135deg,#c8f542,#b7ff00)',
    color: '#000',
    borderRadius: 18,
    padding: '14px 18px',
    fontWeight: 900,
    fontSize: 15,
    alignSelf: 'flex-start',
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(2,1fr)',
    gap: 12,
    marginBottom: 18,
  },

  statCard: {
    background: '#111',
    borderRadius: 20,
    padding: 18,
    border:
      '1px solid rgba(255,255,255,.06)',
  },

  statNumber: {
    fontSize: 34,
    fontWeight: 900,
    color: '#c8f542',
  },

  statLabel: {
    color: '#777',
    marginTop: 6,
    fontSize: 13,
  },

  quickGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(3,1fr)',
    gap: 12,
    marginBottom: 20,
  },

  quickCard: {
    background: '#111',
    borderRadius: 20,
    padding: 18,
    textDecoration: 'none',
    border:
      '1px solid rgba(255,255,255,.06)',
    color: '#fff',
    textAlign: 'center',
  },

  quickEmoji: {
    fontSize: 26,
    marginBottom: 10,
  },

  quickTitle: {
    color: '#c8f542',
    fontWeight: 700,
    fontSize: 15,
  },

  section: {
    background: '#111',
    borderRadius: 22,
    padding: 18,
    border:
      '1px solid rgba(255,255,255,.06)',
  },

  sectionTop: {
    display: 'flex',
    justifyContent:
      'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 22,
    margin: 0,
  },

  refresh: {
    background: 'transparent',
    border:
      '1px solid rgba(200,245,66,.25)',
    color: '#c8f542',
    borderRadius: 12,
    padding: '8px 12px',
    fontSize: 12,
  },

  activityList: {
    display: 'grid',
    gap: 10,
  },

  activityCard: {
    background: '#0b0b0b',
    borderRadius: 16,
    padding: 14,
    border:
      '1px solid rgba(255,255,255,.04)',
    display: 'flex',
    justifyContent:
      'space-between',
    alignItems: 'center',
    gap: 10,
  },

  activityDate: {
    color: '#666',
    marginTop: 6,
    fontSize: 12,
  },

  badge: {
    background: '#1b1b1b',
    color: '#c8f542',
    borderRadius: 12,
    padding: '7px 10px',
    fontWeight: 800,
    fontSize: 12,
    whiteSpace: 'nowrap',
  },
}