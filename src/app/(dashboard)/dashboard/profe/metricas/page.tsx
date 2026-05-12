'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Student = {
  id: string
  full_name: string | null
  email: string | null
}

type Session = {
  id: string
  student_id: string
  routine_id: string
  completed: boolean
  duration_minutes: number
  created_at: string
  profiles?: Student | null
  routines?: {
    titulo: string | null
  } | null
}

type Goal = {
  id: string
  student_id: string
  completed: boolean
}

export default function ProfeMetricasPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [goals, setGoals] = useState<Goal[]>([])

  async function loadData() {
    setLoading(true)
    setMessage('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/login'
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, academia_id')
      .eq('id', user.id)
      .single()

    const { data: studentsData, error: studentsError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'alumno')
      .eq('academia_id', profile?.academia_id)

    if (studentsError) {
      setMessage(studentsError.message)
      setLoading(false)
      return
    }

    const studentRows = studentsData || []
    setStudents(studentRows)

    const studentIds = studentRows.map((s) => s.id)

    if (studentIds.length === 0) {
      setSessions([])
      setGoals([])
      setLoading(false)
      return
    }

    const { data: sessionsData, error: sessionsError } = await supabase
      .from('workout_sessions')
      .select(`
        *,
        profiles:student_id (
          id,
          full_name,
          email
        ),
        routines (
          titulo
        )
      `)
      .in('student_id', studentIds)
      .order('created_at', { ascending: false })

    if (sessionsError) {
      setMessage(sessionsError.message)
      setLoading(false)
      return
    }

    setSessions((sessionsData || []) as Session[])

    const { data: goalsData } = await supabase
      .from('student_goals')
      .select('*')
      .in('student_id', studentIds)

    setGoals((goalsData || []) as Goal[])

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const completedSessions = sessions.filter((s) => s.completed).length

  const totalMinutes = sessions.reduce(
    (acc, s) => acc + (s.duration_minutes || 0),
    0
  )

  const avgMinutes =
    completedSessions > 0 ? Math.round(totalMinutes / completedSessions) : 0

  const completedGoals = goals.filter((g) => g.completed).length

  const weeklyActivity = useMemo(() => {
    const today = new Date()

    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(today)
      date.setDate(today.getDate() - (6 - index))

      const count = sessions.filter((s) => {
        const sessionDate = new Date(s.created_at)
        return sessionDate.toDateString() === date.toDateString()
      }).length

      return {
        label: date.toLocaleDateString('es-CL', { weekday: 'short' }),
        count,
      }
    })
  }, [sessions])

  const maxWeekly = Math.max(...weeklyActivity.map((d) => d.count), 1)

  const studentRanking = useMemo(() => {
    return students
      .map((student) => {
        const studentSessions = sessions.filter((s) => s.student_id === student.id)
        const completed = studentSessions.filter((s) => s.completed).length
        const minutes = studentSessions.reduce(
          (acc, s) => acc + (s.duration_minutes || 0),
          0
        )

        return {
          ...student,
          completed,
          minutes,
          score: completed * 100 + minutes,
        }
      })
      .sort((a, b) => b.score - a.score)
  }, [students, sessions])

  if (loading) {
    return <div style={styles.page}>Cargando métricas...</div>
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Métricas</h1>
          <p style={styles.subtitle}>
            Monitorea actividad, progreso y constancia de tus alumnos.
          </p>
        </div>

        <button style={styles.refresh} onClick={loadData}>
          Actualizar
        </button>
      </div>

      {message && <div style={styles.notice}>{message}</div>}

      <div style={styles.statsGrid}>
        <StatCard value={students.length} label="Alumnos activos" />
        <StatCard value={completedSessions} label="Sesiones completadas" />
        <StatCard value={totalMinutes} label="Minutos entrenados" />
        <StatCard value={completedGoals} label="Objetivos logrados" />
      </div>

      <div style={styles.gridTwo}>
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Actividad últimos 7 días</h2>

          <div style={styles.chart}>
            {weeklyActivity.map((day) => (
              <div key={day.label} style={styles.barItem}>
                <div style={styles.barWrap}>
                  <div
                    style={{
                      ...styles.bar,
                      height: `${Math.max(
                        (day.count / maxWeekly) * 170,
                        day.count ? 22 : 6
                      )}px`,
                    }}
                  />
                </div>

                <span style={styles.dayLabel}>{day.label}</span>
                <strong style={styles.dayCount}>{day.count}</strong>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Resumen de rendimiento</h2>

          <div style={styles.summaryList}>
            <SummaryItem label="Promedio por sesión" value={`${avgMinutes} min`} />
            <SummaryItem label="Sesiones por alumno" value={
              students.length > 0
                ? `${Math.round(completedSessions / students.length)}`
                : '0'
            } />
            <SummaryItem label="Cumplimiento objetivos" value={
              goals.length > 0
                ? `${Math.round((completedGoals / goals.length) * 100)}%`
                : '0%'
            } />
            <SummaryItem label="Nivel comunidad" value="PRO" />
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Ranking de alumnos</h2>

        {studentRanking.length === 0 ? (
          <div style={styles.empty}>Aún no tienes alumnos activos.</div>
        ) : (
          <div style={styles.rankingList}>
            {studentRanking.map((student, index) => (
              <div key={student.id} style={styles.rankingRow}>
                <div style={styles.rankBadge}>#{index + 1}</div>

                <div style={{ flex: 1 }}>
                  <strong style={styles.studentName}>
                    {student.full_name || student.email}
                  </strong>

                  <p style={styles.studentMeta}>
                    {student.completed} sesiones · {student.minutes} min
                  </p>
                </div>

                <div style={styles.scoreBadge}>{student.score} pts</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Actividad reciente</h2>

        {sessions.length === 0 ? (
          <div style={styles.empty}>Todavía no hay sesiones registradas.</div>
        ) : (
          <div style={styles.sessionList}>
            {sessions.slice(0, 10).map((s) => (
              <div key={s.id} style={styles.sessionRow}>
                <div>
                  <strong style={styles.sessionTitle}>
                    {s.profiles?.full_name || s.profiles?.email || 'Alumno'}
                  </strong>

                  <p style={styles.sessionMeta}>
                    {s.routines?.titulo || 'Entrenamiento'} ·{' '}
                    {new Date(s.created_at).toLocaleDateString('es-CL')}
                  </p>
                </div>

                <span style={styles.badge}>
                  {s.completed ? '✅' : '⏳'} {s.duration_minutes || 0} min
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div style={styles.statCard}>
      <span style={styles.statNumber}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.summaryItem}>
      <strong style={styles.summaryValue}>{value}</strong>
      <span style={styles.summaryLabel}>{label}</span>
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

  gridTwo: {
    display: 'grid',
    gridTemplateColumns: '1.2fr .8fr',
    gap: 24,
    marginBottom: 24,
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
    minHeight: 230,
  },

  barItem: {
    flex: 1,
    textAlign: 'center',
  },

  barWrap: {
    height: 180,
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

  summaryList: {
    display: 'grid',
    gap: 14,
  },

  summaryItem: {
    background: '#0a0a0a',
    border: '1px solid rgba(255,255,255,.06)',
    borderRadius: 18,
    padding: 18,
  },

  summaryValue: {
    display: 'block',
    color: '#c8f542',
    fontSize: 30,
  },

  summaryLabel: {
    color: '#8a8a8a',
    marginTop: 8,
    display: 'block',
  },

  empty: {
    color: '#8a8a8a',
    padding: 20,
  },

  rankingList: {
    display: 'grid',
    gap: 12,
  },

  rankingRow: {
    background: '#0a0a0a',
    border: '1px solid rgba(255,255,255,.06)',
    borderRadius: 18,
    padding: 18,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },

  rankBadge: {
    background: '#c8f542',
    color: '#000',
    width: 44,
    height: 44,
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 900,
  },

  studentName: {
    color: '#fff',
  },

  studentMeta: {
    color: '#8a8a8a',
    marginTop: 6,
    marginBottom: 0,
  },

  scoreBadge: {
    background: '#1b1b1b',
    color: '#c8f542',
    borderRadius: 999,
    padding: '8px 12px',
    fontWeight: 900,
    whiteSpace: 'nowrap',
  },

  sessionList: {
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

  sessionMeta: {
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
}