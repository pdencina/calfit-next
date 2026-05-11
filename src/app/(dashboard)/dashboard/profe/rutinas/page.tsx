'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Profile = {
  id: string
  email: string | null
  full_name: string | null
  role: string | null
  academia_id: string | null
}

type Routine = {
  id: string
  titulo: string | null
  descripcion: string | null
  created_at: string
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

export default function ProfeRutinasPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [students, setStudents] = useState<Profile[]>([])
  const [routines, setRoutines] = useState<Routine[]>([])
  const [exercises, setExercises] = useState<Record<string, Exercise[]>>({})
  const [selectedRoutine, setSelectedRoutine] = useState('')
  const [selectedStudent, setSelectedStudent] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const [routineForm, setRoutineForm] = useState({ titulo: '', descripcion: '' })
  const [exerciseForm, setExerciseForm] = useState({ routine_id: '', nombre: '', sets: 3, reps: '10', descanso: 60, video_url: '' })

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

    const { data: myProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', auth.user.id)
      .maybeSingle()

    if (profileError || !myProfile) {
      setMessage('No se pudo cargar tu perfil.')
      setLoading(false)
      return
    }

    setProfile(myProfile)

    const { data: studentRows } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'alumno')
      .eq('academia_id', myProfile.academia_id)
      .order('full_name', { ascending: true })

    setStudents(studentRows || [])

    const { data: routineRows } = await supabase
      .from('routines')
      .select('*')
      .eq('academia_id', myProfile.academia_id)
      .order('created_at', { ascending: false })

    setRoutines(routineRows || [])

    if (routineRows?.length) {
      const ids = routineRows.map((r: Routine) => r.id)
      const { data: exerciseRows } = await supabase
        .from('routine_exercises')
        .select('*')
        .in('routine_id', ids)
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

  async function createRoutine(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setMessage('')

    const { error } = await supabase.from('routines').insert({
      titulo: routineForm.titulo,
      descripcion: routineForm.descripcion,
      profe_id: profile.id,
      academia_id: profile.academia_id,
      is_active: true,
    })

    if (error) {
      setMessage(error.message)
      return
    }

    setRoutineForm({ titulo: '', descripcion: '' })
    setMessage('Rutina creada correctamente.')
    await loadData()
  }

  async function addExercise(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')

    const routineId = exerciseForm.routine_id || selectedRoutine
    if (!routineId) {
      setMessage('Selecciona una rutina para agregar ejercicios.')
      return
    }

    const currentCount = exercises[routineId]?.length || 0

    const { error } = await supabase.from('routine_exercises').insert({
      routine_id: routineId,
      nombre: exerciseForm.nombre,
      sets: Number(exerciseForm.sets),
      reps: exerciseForm.reps,
      descanso: Number(exerciseForm.descanso),
      video_url: exerciseForm.video_url || null,
      orden: currentCount + 1,
    })

    if (error) {
      setMessage(error.message)
      return
    }

    setExerciseForm({ routine_id: routineId, nombre: '', sets: 3, reps: '10', descanso: 60, video_url: '' })
    setMessage('Ejercicio agregado.')
    await loadData()
  }

  async function assignRoutine(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setMessage('')

    if (!selectedRoutine || !selectedStudent) {
      setMessage('Selecciona rutina y alumno.')
      return
    }

    const { error } = await supabase.from('student_routines').upsert({
      student_id: selectedStudent,
      routine_id: selectedRoutine,
      assigned_by: profile.id,
    }, { onConflict: 'student_id,routine_id' })

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Rutina asignada correctamente.')
  }

  if (loading) return <Page><Card>Cargando rutinas...</Card></Page>

  return (
    <Page>
      <div style={headerStyle}>
        <div>
          <h1 style={h1}>Rutinas</h1>
          <p style={muted}>Crea rutinas, agrega ejercicios y asígnalas a tus alumnos.</p>
        </div>
        <button onClick={loadData} style={secondaryButton}>Actualizar</button>
      </div>

      {message && <div style={notice}>{message}</div>}

      <div style={grid2}>
        <Card>
          <h2 style={h2}>Crear rutina</h2>
          <form onSubmit={createRoutine} style={form}>
            <input style={input} placeholder="Nombre de la rutina" value={routineForm.titulo} onChange={e => setRoutineForm({ ...routineForm, titulo: e.target.value })} required />
            <textarea style={textarea} placeholder="Descripción" value={routineForm.descripcion} onChange={e => setRoutineForm({ ...routineForm, descripcion: e.target.value })} />
            <button style={primaryButton}>Crear rutina</button>
          </form>
        </Card>

        <Card>
          <h2 style={h2}>Asignar rutina</h2>
          <form onSubmit={assignRoutine} style={form}>
            <select style={input} value={selectedRoutine} onChange={e => { setSelectedRoutine(e.target.value); setExerciseForm({ ...exerciseForm, routine_id: e.target.value }) }} required>
              <option value="">Seleccionar rutina</option>
              {routines.map(r => <option key={r.id} value={r.id}>{r.titulo || 'Rutina sin título'}</option>)}
            </select>
            <select style={input} value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} required>
              <option value="">Seleccionar alumno</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.full_name || s.email}</option>)}
            </select>
            <button style={primaryButton}>Asignar alumno</button>
          </form>
        </Card>
      </div>

      <Card>
        <h2 style={h2}>Agregar ejercicio</h2>
        <form onSubmit={addExercise} style={grid5}>
          <select style={input} value={exerciseForm.routine_id || selectedRoutine} onChange={e => setExerciseForm({ ...exerciseForm, routine_id: e.target.value })} required>
            <option value="">Rutina</option>
            {routines.map(r => <option key={r.id} value={r.id}>{r.titulo || 'Rutina sin título'}</option>)}
          </select>
          <input style={input} placeholder="Ejercicio" value={exerciseForm.nombre} onChange={e => setExerciseForm({ ...exerciseForm, nombre: e.target.value })} required />
          <input style={input} type="number" placeholder="Series" value={exerciseForm.sets} onChange={e => setExerciseForm({ ...exerciseForm, sets: Number(e.target.value) })} />
          <input style={input} placeholder="Reps" value={exerciseForm.reps} onChange={e => setExerciseForm({ ...exerciseForm, reps: e.target.value })} />
          <input style={input} type="number" placeholder="Descanso seg." value={exerciseForm.descanso} onChange={e => setExerciseForm({ ...exerciseForm, descanso: Number(e.target.value) })} />
          <input style={{ ...input, gridColumn: '1 / -1' }} placeholder="URL video opcional" value={exerciseForm.video_url} onChange={e => setExerciseForm({ ...exerciseForm, video_url: e.target.value })} />
          <button style={{ ...primaryButton, gridColumn: '1 / -1' }}>Agregar ejercicio</button>
        </form>
      </Card>

      <div style={routineList}>
        {routines.map(routine => (
          <Card key={routine.id}>
            <h3 style={h3}>{routine.titulo || 'Rutina sin título'}</h3>
            <p style={muted}>{routine.descripcion || 'Sin descripción'}</p>
            <div style={{ marginTop: 16 }}>
              {(exercises[routine.id] || []).map((ex, idx) => (
                <div key={ex.id} style={exerciseRow}>
                  <strong>{idx + 1}. {ex.nombre}</strong>
                  <span>{ex.sets} series · {ex.reps} reps · {ex.descanso}s</span>
                </div>
              ))}
              {(!exercises[routine.id] || exercises[routine.id].length === 0) && <p style={muted}>Aún no tiene ejercicios.</p>}
            </div>
          </Card>
        ))}
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
const h2 = { margin: '0 0 18px', fontSize: 22, color: '#fff' }
const h3 = { margin: '0 0 8px', fontSize: 20, color: '#c8f542' }
const muted = { margin: 0, color: '#888', fontSize: 14 }
const headerStyle = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 24 }
const card = { background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 22, marginBottom: 20 }
const form = { display: 'grid', gap: 12 }
const grid2 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }
const grid5 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }
const routineList = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }
const input = { width: '100%', background: '#050505', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 14, color: '#fff', boxSizing: 'border-box' as const }
const textarea = { ...input, minHeight: 100, resize: 'vertical' as const }
const primaryButton = { background: '#c8f542', color: '#050505', border: 0, borderRadius: 12, padding: 14, fontWeight: 800, cursor: 'pointer' }
const secondaryButton = { background: 'transparent', color: '#c8f542', border: '1px solid rgba(200,245,66,0.4)', borderRadius: 12, padding: '12px 16px', cursor: 'pointer' }
const notice = { background: 'rgba(200,245,66,0.08)', border: '1px solid rgba(200,245,66,0.25)', color: '#c8f542', borderRadius: 14, padding: 14, marginBottom: 20 }
const exerciseRow = { display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#ddd', fontSize: 14 }
