'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Routine = {
  id: string
  titulo: string | null
  descripcion: string | null
}

type Assigned = {
  id: string
  routine_id: string
  routines: Routine | Routine[] | null
}

type Exercise = {
  id: string
  routine_id: string
  nombre: string | null
  sets: number | null
  reps: string | null
  descanso: number | null
  video_url: string | null
}

export default function AlumnoRutinasPage() {
  const supabase = createClient()
  const [studentId, setStudentId] = useState('')
  const [assigned, setAssigned] = useState<Assigned[]>([])
  const [exercises, setExercises] = useState<Record<string, Exercise[]>>({})
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [notes, setNotes] = useState<Record<string, string>>({})

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadData() {
    setLoading(true)
    setMessage('')

    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) {
      setMessage('No hay sesión activa.')
      setLoading(false)
      return
    }

    setStudentId(auth.user.id)

    const { data: rows, error } = await supabase
      .from('student_routines')
      .select('id, routine_id, routines(id, titulo, descripcion)')
      .eq('student_id', auth.user.id)
      .order('assigned_at', { ascending: false })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    const assignedRows = (rows || []) as Assigned[]
    setAssigned(assignedRows)

    const routineIds = assignedRows.map(r => r.routine_id)
    if (routineIds.length) {
      const { data: exerciseRows } = await supabase
        .from('routine_exercises')
        .select('*')
        .in('routine_id', routineIds)
        .order('orden', { ascending: true })

      const grouped: Record<string, Exercise[]> = {}
      for (const ex of exerciseRows || []) {
        if (!grouped[ex.routine_id]) grouped[ex.routine_id] = []
        grouped[ex.routine_id].push(ex)
      }
      setExercises(grouped)
    } else {
      setExercises({})
    }

    setLoading(false)
  }

  async function completeRoutine(routineId: string) {
    setMessage('')

    const { error } = await supabase.from('workout_sessions').insert({
      student_id: studentId,
      routine_id: routineId,
      completed: true,
      notes: notes[routineId] || null,
    })

    if (error) {
      setMessage(error.message)
      return
    }

    setNotes({ ...notes, [routineId]: '' })
    setMessage('Sesión completada. ¡Buen trabajo!')
  }

  if (loading) return <Page><Card>Cargando tus rutinas...</Card></Page>

  return (
    <Page>
      <div style={headerStyle}>
        <div>
          <h1 style={h1}>Mis Rutinas</h1>
          <p style={muted}>Aquí verás las rutinas asignadas por tu profe.</p>
        </div>
        <button onClick={loadData} style={secondaryButton}>Actualizar</button>
      </div>

      {message && <div style={notice}>{message}</div>}

      {assigned.length === 0 && (
        <Card>
          <h2 style={h2}>Aún no tienes rutinas asignadas</h2>
          <p style={muted}>Cuando tu profe te asigne una rutina, aparecerá en esta sección.</p>
        </Card>
      )}

      <div style={routineList}>
        {assigned.map(item => {
          const routine = Array.isArray(item.routines) ? item.routines[0] : item.routines
          return (
            <Card key={item.id}>
              <h2 style={h2}>{routine?.titulo || 'Rutina sin título'}</h2>
              <p style={muted}>{routine?.descripcion || 'Sin descripción'}</p>

              <div style={{ marginTop: 18 }}>
                {(exercises[item.routine_id] || []).map((ex, idx) => (
                  <div key={ex.id} style={exerciseRow}>
                    <div>
                      <strong>{idx + 1}. {ex.nombre}</strong>
                      {ex.video_url && (
                        <a href={ex.video_url} target="_blank" style={videoLink}>Ver video</a>
                      )}
                    </div>
                    <span>{ex.sets} series · {ex.reps} reps · {ex.descanso}s</span>
                  </div>
                ))}
              </div>

              <textarea
                style={textarea}
                placeholder="Notas de la sesión: ¿cómo te sentiste?, ¿qué lograste?"
                value={notes[item.routine_id] || ''}
                onChange={e => setNotes({ ...notes, [item.routine_id]: e.target.value })}
              />

              <button onClick={() => completeRoutine(item.routine_id)} style={primaryButton}>
                Marcar como completada
              </button>
            </Card>
          )
        })}
      </div>
    </Page>
  )
}

function Page({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: 32, color: '#fff' }}>{children}</div>
}

function Card({ children }: { children: React.ReactNode }) {
  return <div style={card}>{children}</div>
}

const h1 = { margin: 0, fontSize: 36, color: '#fff' }
const h2 = { margin: '0 0 10px', fontSize: 24, color: '#c8f542' }
const muted = { margin: 0, color: '#888', fontSize: 14 }
const headerStyle = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 24 }
const card = { background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 22, marginBottom: 20 }
const routineList = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }
const textarea = { width: '100%', background: '#050505', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 14, color: '#fff', boxSizing: 'border-box' as const, minHeight: 90, marginTop: 18, marginBottom: 14 }
const primaryButton = { width: '100%', background: '#c8f542', color: '#050505', border: 0, borderRadius: 12, padding: 14, fontWeight: 800, cursor: 'pointer' }
const secondaryButton = { background: 'transparent', color: '#c8f542', border: '1px solid rgba(200,245,66,0.4)', borderRadius: 12, padding: '12px 16px', cursor: 'pointer' }
const notice = { background: 'rgba(200,245,66,0.08)', border: '1px solid rgba(200,245,66,0.25)', color: '#c8f542', borderRadius: 14, padding: 14, marginBottom: 20 }
const exerciseRow = { display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#ddd', fontSize: 14 }
const videoLink = { display: 'block', color: '#c8f542', fontSize: 12, marginTop: 6, textDecoration: 'none' }
