'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Goal = {
  id: string
  title: string
  description: string | null
  target_value: number | null
  current_value: number | null
  unit: string | null
  completed: boolean
  created_at: string
}

export default function AlumnoObjetivosPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [studentId, setStudentId] = useState('')
  const [goals, setGoals] = useState<Goal[]>([])
  const [message, setMessage] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetValue, setTargetValue] = useState('')
  const [unit, setUnit] = useState('reps')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/login'
      return
    }

    setStudentId(user.id)

    const { data, error } = await supabase
      .from('student_goals')
      .select('*')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    setGoals(data || [])
    setLoading(false)
  }

  async function createGoal() {
    if (!title.trim()) {
      setMessage('Escribe un objetivo.')
      return
    }

    setSaving(true)
    setMessage('')

    const { error } = await supabase.from('student_goals').insert({
      student_id: studentId,
      title: title.trim(),
      description: description.trim() || null,
      target_value: Number(targetValue) || null,
      current_value: 0,
      unit,
      completed: false,
    })

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    setTitle('')
    setDescription('')
    setTargetValue('')
    setUnit('reps')
    setMessage('Objetivo creado.')
    await loadData()
    setSaving(false)
  }

  async function updateProgress(goal: Goal, value: number) {
    const nextValue = Math.max(0, value)
    const isCompleted =
      goal.target_value !== null &&
      goal.target_value > 0 &&
      nextValue >= goal.target_value

    const { error } = await supabase
      .from('student_goals')
      .update({
        current_value: nextValue,
        completed: isCompleted,
      })
      .eq('id', goal.id)

    if (error) {
      setMessage(error.message)
      return
    }

    await loadData()
  }

  async function deleteGoal(goalId: string) {
    const ok = window.confirm('¿Eliminar este objetivo?')
    if (!ok) return

    const { error } = await supabase
      .from('student_goals')
      .delete()
      .eq('id', goalId)

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Objetivo eliminado.')
    await loadData()
  }

  if (loading) {
    return <div style={styles.page}>Cargando objetivos...</div>
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Objetivos</h1>
          <p style={styles.subtitle}>
            Define metas personales y registra tu progreso.
          </p>
        </div>

        <button style={styles.refresh} onClick={loadData}>
          Actualizar
        </button>
      </div>

      {message && <div style={styles.notice}>{message}</div>}

      <div style={styles.grid}>
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Nuevo objetivo</h2>

          <input
            style={styles.input}
            placeholder="Ej: Lograr 10 dominadas"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            style={styles.textarea}
            placeholder="Descripción opcional"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div style={styles.twoCols}>
            <input
              style={styles.input}
              placeholder="Meta"
              type="number"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
            />

            <select
              style={styles.input}
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              <option value="reps">reps</option>
              <option value="kg">kg</option>
              <option value="seg">seg</option>
              <option value="min">min</option>
              <option value="dias">días</option>
            </select>
          </div>

          <button style={styles.button} disabled={saving} onClick={createGoal}>
            {saving ? 'Guardando...' : 'Crear objetivo'}
          </button>
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Resumen</h2>

          <div style={styles.statsGrid}>
            <div style={styles.statBox}>
              <strong style={styles.statNumber}>{goals.length}</strong>
              <span style={styles.statLabel}>Objetivos</span>
            </div>

            <div style={styles.statBox}>
              <strong style={styles.statNumber}>
                {goals.filter((g) => g.completed).length}
              </strong>
              <span style={styles.statLabel}>Completados</span>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.list}>
        {goals.length === 0 ? (
          <div style={styles.empty}>Aún no tienes objetivos creados.</div>
        ) : (
          goals.map((goal) => {
            const target = goal.target_value || 0
            const current = goal.current_value || 0
            const percent =
              target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0

            return (
              <div key={goal.id} style={styles.goalCard}>
                <div style={styles.goalTop}>
                  <div>
                    <h2 style={styles.goalTitle}>
                      {goal.completed ? '✅ ' : '🎯 '}
                      {goal.title}
                    </h2>

                    {goal.description && (
                      <p style={styles.goalDesc}>{goal.description}</p>
                    )}
                  </div>

                  <button
                    style={styles.deleteButton}
                    onClick={() => deleteGoal(goal.id)}
                  >
                    Eliminar
                  </button>
                </div>

                <div style={styles.progressBar}>
                  <div style={{ ...styles.progressFill, width: `${percent}%` }} />
                </div>

                <div style={styles.progressText}>
                  <span>
                    {current} / {target || '-'} {goal.unit}
                  </span>

                  <strong>{percent}%</strong>
                </div>

                <div style={styles.actions}>
                  <button
                    style={styles.smallButton}
                    onClick={() => updateProgress(goal, current - 1)}
                  >
                    -1
                  </button>

                  <button
                    style={styles.smallButton}
                    onClick={() => updateProgress(goal, current + 1)}
                  >
                    +1
                  </button>

                  <button
                    style={styles.completeButton}
                    onClick={() => updateProgress(goal, target)}
                  >
                    Marcar completado
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 32, color: '#fff' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 20,
    alignItems: 'center',
    marginBottom: 30,
  },
  title: { fontSize: 42, margin: 0, fontWeight: 900 },
  subtitle: { color: '#8a8a8a', marginTop: 8 },
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))',
    gap: 20,
    marginBottom: 24,
  },
  card: {
    background: '#111',
    border: '1px solid rgba(255,255,255,.06)',
    borderRadius: 24,
    padding: 24,
  },
  sectionTitle: { marginTop: 0, fontSize: 26 },
  input: {
    width: '100%',
    background: '#050505',
    border: '1px solid rgba(255,255,255,.12)',
    color: '#fff',
    borderRadius: 14,
    padding: 14,
    boxSizing: 'border-box',
    marginBottom: 12,
  },
  textarea: {
    width: '100%',
    minHeight: 90,
    background: '#050505',
    border: '1px solid rgba(255,255,255,.12)',
    color: '#fff',
    borderRadius: 14,
    padding: 14,
    boxSizing: 'border-box',
    marginBottom: 12,
  },
  twoCols: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  button: {
    width: '100%',
    background: '#c8f542',
    color: '#000',
    border: 0,
    borderRadius: 14,
    padding: 16,
    fontWeight: 900,
    cursor: 'pointer',
    marginTop: 8,
  },
  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  statBox: {
    background: '#0a0a0a',
    border: '1px solid rgba(255,255,255,.06)',
    borderRadius: 18,
    padding: 20,
  },
  statNumber: {
    display: 'block',
    fontSize: 38,
    color: '#c8f542',
  },
  statLabel: { color: '#8a8a8a' },
  list: { display: 'grid', gap: 16 },
  empty: {
    background: '#111',
    border: '1px solid rgba(255,255,255,.06)',
    borderRadius: 24,
    padding: 40,
    textAlign: 'center',
    color: '#8a8a8a',
  },
  goalCard: {
    background: '#111',
    border: '1px solid rgba(255,255,255,.06)',
    borderRadius: 24,
    padding: 24,
  },
  goalTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'flex-start',
  },
  goalTitle: { color: '#c8f542', margin: 0 },
  goalDesc: { color: '#8a8a8a', marginTop: 8 },
  progressBar: {
    height: 14,
    background: '#050505',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 20,
    border: '1px solid rgba(255,255,255,.06)',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg,#c8f542,#00ff88)',
    borderRadius: 999,
  },
  progressText: {
    display: 'flex',
    justifyContent: 'space-between',
    color: '#ddd',
    marginTop: 10,
  },
  actions: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 18,
  },
  smallButton: {
    background: '#1b1b1b',
    color: '#fff',
    border: '1px solid rgba(255,255,255,.08)',
    borderRadius: 12,
    padding: '10px 14px',
    cursor: 'pointer',
  },
  completeButton: {
    background: '#c8f542',
    color: '#000',
    border: 0,
    borderRadius: 12,
    padding: '10px 14px',
    fontWeight: 900,
    cursor: 'pointer',
  },
  deleteButton: {
    background: '#3b0b0b',
    color: '#ff7b7b',
    border: '1px solid #7f1d1d',
    borderRadius: 12,
    padding: '10px 14px',
    cursor: 'pointer',
    fontWeight: 800,
  },
}