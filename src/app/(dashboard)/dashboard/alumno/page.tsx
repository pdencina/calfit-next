'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type WorkoutSession = {
  id: string
  completed: boolean
  duration_minutes: number
  created_at: string
}

type StudentRoutine = {
  id: string
  routines: {
    id: string
    titulo: string
    descripcion: string
    objetivo?: string
    duracion_min?: number
  }
}

export default function AlumnoDashboardPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [routines, setRoutines] = useState<StudentRoutine[]>([])
  const [studentName, setStudentName] = useState('Alumno')

  async function loadDashboard() {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/login'
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profile?.full_name) setStudentName(profile.full_name)

    const { data: sessionsData } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })

    setSessions(sessionsData || [])

    const { data: routinesData } = await supabase
      .from('student_routines')
      .select(`
        *,
        routines (
          id,
          titulo,
          descripcion,
          objetivo,
          duracion_min
        )
      `)
      .eq('student_id', user.id)

    setRoutines(routinesData || [])
    setLoading(false)
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const completedSessions = sessions.filter((s) => s.completed).length

  const totalMinutes = sessions.reduce(
    (acc, s) => acc + (s.duration_minutes || 0),
    0
  )

  const xp = completedSessions * 120 + totalMinutes * 2
  const level = Math.floor(xp / 1000) + 1
  const currentLevelXp = xp % 1000
  const nextLevelPercent = Math.min(Math.round((currentLevelXp / 1000) * 100), 100)

  const streak = useMemo(() => {
    const uniqueDays = Array.from(
      new Set(
        sessions
          .filter((s) => s.completed)
          .map((s) => new Date(s.created_at).toDateString())
      )
    )

    let count = 0
    const today = new Date()

    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)

      if (uniqueDays.includes(date.toDateString())) {
        count++
      } else if (i > 0) {
        break
      }
    }

    return count
  }, [sessions])

  const weeklyProgress = useMemo(() => {
    const today = new Date()

    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(today)
      date.setDate(today.getDate() - (6 - index))

      const count = sessions.filter((s) => {
        const d = new Date(s.created_at)
        return d.toDateString() === date.toDateString()
      }).length

      return {
        label: date.toLocaleDateString('es-CL', { weekday: 'short' }),
        count,
      }
    })
  }, [sessions])

  const achievements = [
    {
      title: 'Primer entrenamiento',
      unlocked: completedSessions >= 1,
      icon: '🏁',
    },
    {
      title: '5 sesiones completadas',
      unlocked: completedSessions >= 5,
      icon: '🔥',
    },
    {
      title: '100 minutos entrenados',
      unlocked: totalMinutes >= 100,
      icon: '⏱️',
    },
    {
      title: 'Nivel 3 alcanzado',
      unlocked: level >= 3,
      icon: '🏆',
    },
  ]

  if (loading) {
    return <div style={styles.page}>Cargando dashboard...</div>
  }

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <div>
          <h1 style={styles.title}>Hola {studentName} 👋</h1>
          <p style={styles.subtitle}>
            Sube de nivel, mantén tu racha y completa tus entrenamientos.
          </p>
        </div>

        <div style={styles.streakCard}>🔥 {streak} días de racha</div>
      </div>

      <div style={styles.levelCard}>
        <div style={styles.levelHeader}>
          <div>
            <div style={styles.levelLabel}>NIVEL ACTUAL</div>
            <div style={styles.levelNumber}>Nivel {level}</div>
          </div>

          <div style={styles.xpText}>{xp} XP</div>
        </div>

        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${nextLevelPercent}%` }} />
        </div>

        <div style={styles.progressFooter}>
          <span>{currentLevelXp} / 1000 XP</span>
          <span>{nextLevelPercent}% al próximo nivel</span>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span style={styles.statNumber}>{routines.length}</span>
          <span style={styles.statLabel}>Rutinas activas</span>
        </div>

        <div style={styles.statCard}>
          <span style={styles.statNumber}>{completedSessions}</span>
          <span style={styles.statLabel}>Sesiones completadas</span>
        </div>

        <div style={styles.statCard}>
          <span style={styles.statNumber}>{totalMinutes}</span>
          <span style={styles.statLabel}>Minutos entrenados</span>
        </div>
      </div>

      <div style={styles.grid}>
        <Link href="/dashboard/alumno/rutinas" style={styles.card}>
          <div style={styles.cardEmoji}>💪</div>
          <h2 style={styles.cardTitle}>Ver mis rutinas</h2>
          <p style={styles.cardText}>Revisa tus entrenamientos y ejercicios asignados.</p>
        </Link>

        <Link href="/dashboard/alumno/historial" style={styles.card}>
          <div style={styles.cardEmoji}>📆</div>
          <h2 style={styles.cardTitle}>Historial</h2>
          <p style={styles.cardText}>Mira todas tus sesiones y entrenamientos completados.</p>
        </Link>

        <Link href="/dashboard/alumno/metricas" style={styles.card}>
          <div style={styles.cardEmoji}>📊</div>
          <h2 style={styles.cardTitle}>Métricas</h2>
          <p style={styles.cardText}>Visualiza tu progreso, constancia y evolución.</p>
        </Link>
      </div>

      <div style={styles.twoCols}>
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Progreso semanal</h2>
          </div>

          <div style={styles.weekGrid}>
            {weeklyProgress.map((day) => (
              <div key={day.label} style={styles.dayBox}>
                <div
                  style={{
                    ...styles.dayDot,
                    background: day.count > 0 ? '#c6ff32' : '#222',
                  }}
                />
                <span style={styles.dayLabel}>{day.label}</span>
                <strong style={styles.dayCount}>{day.count}</strong>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Logros</h2>
          </div>

          <div style={styles.achievementList}>
            {achievements.map((a) => (
              <div
                key={a.title}
                style={{
                  ...styles.achievement,
                  opacity: a.unlocked ? 1 : 0.35,
                }}
              >
                <span style={styles.achievementIcon}>{a.icon}</span>
                <span>{a.title}</span>
                <strong>{a.unlocked ? 'Desbloqueado' : 'Bloqueado'}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Rutinas activas</h2>
          <Link href="/dashboard/alumno/rutinas" style={styles.link}>
            Ver todas →
          </Link>
        </div>

        {routines.length === 0 ? (
          <div style={styles.empty}>Aún no tienes rutinas asignadas.</div>
        ) : (
          <div style={styles.routineList}>
            {routines.map((r) => (
              <div key={r.id} style={styles.routineCard}>
                <div>
                  <h3 style={styles.routineTitle}>{r.routines?.titulo}</h3>
                  <p style={styles.routineDesc}>{r.routines?.descripcion}</p>
                  <p style={styles.goal}>🎯 {r.routines?.objetivo}</p>
                </div>

                <div style={styles.time}>
                  ⏱️ {r.routines?.duracion_min || 45} min
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Últimas sesiones</h2>
        </div>

        {sessions.length === 0 ? (
          <div style={styles.empty}>Aún no registras sesiones.</div>
        ) : (
          <div style={styles.sessionList}>
            {sessions.slice(0, 5).map((s) => (
              <div key={s.id} style={styles.sessionCard}>
                <div>
                  <strong>
                    {s.completed ? '✅ Entrenamiento completado' : '⏳ En progreso'}
                  </strong>

                  <p style={{ color: '#8a8a8a', marginTop: 4 }}>
                    {new Date(s.created_at).toLocaleDateString('es-CL')}
                  </p>
                </div>

                <div style={styles.sessionMinutes}>⏱️ {s.duration_minutes} min</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 32, color: '#fff' },
  hero: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 20,
    marginBottom: 30,
  },
  title: { fontSize: 42, margin: 0, fontWeight: 900 },
  subtitle: { color: '#8a8a8a', marginTop: 10 },
  streakCard: {
    background: 'linear-gradient(135deg,#c6ff32,#9eff00)',
    color: '#000',
    padding: '18px 22px',
    borderRadius: 18,
    fontWeight: 900,
    fontSize: 18,
    whiteSpace: 'nowrap',
  },
  levelCard: {
    background: '#111',
    border: '1px solid rgba(255,255,255,.08)',
    borderRadius: 26,
    padding: 26,
    marginBottom: 30,
  },
  levelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  levelLabel: { color: '#777', fontSize: 12, letterSpacing: 2 },
  levelNumber: { color: '#c6ff32', fontSize: 36, fontWeight: 900 },
  xpText: { color: '#fff', fontSize: 26, fontWeight: 900 },
  progressBar: {
    height: 16,
    background: '#050505',
    borderRadius: 999,
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,.06)',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg,#c6ff32,#00ff88)',
  },
  progressFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    color: '#8a8a8a',
    marginTop: 10,
    fontSize: 13,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
    gap: 20,
    marginBottom: 30,
  },
  statCard: {
    background: '#111',
    border: '1px solid rgba(255,255,255,.08)',
    borderRadius: 22,
    padding: 24,
  },
  statNumber: {
    fontSize: 42,
    fontWeight: 900,
    color: '#c6ff32',
    display: 'block',
  },
  statLabel: { color: '#8a8a8a', marginTop: 8, display: 'block' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 20,
    marginBottom: 30,
  },
  card: {
    display: 'block',
    background: '#111',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 24,
    padding: 24,
    color: '#fff',
    textDecoration: 'none',
  },
  cardEmoji: { fontSize: 42, marginBottom: 16 },
  cardTitle: { color: '#c6ff32', marginBottom: 10 },
  cardText: { color: '#8a8a8a', lineHeight: 1.5 },
  twoCols: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))',
    gap: 20,
    marginBottom: 24,
  },
  section: {
    background: '#111',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    border: '1px solid rgba(255,255,255,.06)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: { margin: 0, fontSize: 28 },
  link: { color: '#c6ff32', textDecoration: 'none', fontWeight: 700 },
  weekGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7,1fr)',
    gap: 10,
  },
  dayBox: {
    background: '#0a0a0a',
    borderRadius: 16,
    padding: 14,
    textAlign: 'center',
    border: '1px solid rgba(255,255,255,.06)',
  },
  dayDot: {
    width: 18,
    height: 18,
    borderRadius: '50%',
    margin: '0 auto 10px',
  },
  dayLabel: {
    display: 'block',
    color: '#8a8a8a',
    textTransform: 'capitalize',
    fontSize: 12,
  },
  dayCount: { display: 'block', color: '#c6ff32', marginTop: 6 },
  achievementList: { display: 'grid', gap: 12 },
  achievement: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
    background: '#0a0a0a',
    border: '1px solid rgba(255,255,255,.06)',
    borderRadius: 16,
    padding: 14,
  },
  achievementIcon: { fontSize: 24 },
  empty: { color: '#8a8a8a', padding: 20 },
  routineList: { display: 'grid', gap: 14 },
  routineCard: {
    background: '#0d0d0d',
    border: '1px solid #222',
    borderRadius: 18,
    padding: 20,
    display: 'flex',
    justifyContent: 'space-between',
    gap: 20,
    alignItems: 'center',
  },
  routineTitle: { color: '#c6ff32', marginBottom: 8 },
  routineDesc: { color: '#8a8a8a', marginBottom: 8 },
  goal: { color: '#ddd', fontSize: 14 },
  time: {
    background: '#1b1b1b',
    padding: '10px 14px',
    borderRadius: 14,
    color: '#c6ff32',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  sessionList: { display: 'grid', gap: 12 },
  sessionCard: {
    background: '#0d0d0d',
    border: '1px solid #222',
    borderRadius: 16,
    padding: 18,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 20,
  },
  sessionMinutes: { color: '#c6ff32', fontWeight: 800 },
}
