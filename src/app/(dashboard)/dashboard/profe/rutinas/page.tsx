'use client'

import { useEffect, useMemo, useState } from 'react'
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
  titulo: string
  descripcion: string | null
  nivel?: string | null
  categoria?: string | null
  objetivo?: string | null
  duracion_min?: number | null
  is_template?: boolean | null
  template_source_id?: string | null
  profe_id?: string | null
  academia_id?: string | null
}

type Exercise = {
  id: string
  routine_id: string
  nombre: string
  sets: number | null
  reps: number | null
  descanso: number | null
  video_url?: string | null
  orden?: number | null
  notas?: string | null
}

export default function ProfeRutinasPage() {
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [students, setStudents] = useState<Profile[]>([])
  const [templates, setTemplates] = useState<Routine[]>([])
  const [myRoutines, setMyRoutines] = useState<Routine[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('Todos')

  const [selectedRoutineId, setSelectedRoutineId] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('')

  const [customTitle, setCustomTitle] = useState('')
  const [customDescription, setCustomDescription] = useState('')

  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editSets, setEditSets] = useState('')
  const [editReps, setEditReps] = useState('')
  const [editRest, setEditRest] = useState('')
  const [editVideo, setEditVideo] = useState('')

  async function loadData() {
    setLoading(true)

    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user

    if (!user) {
      window.location.href = '/login'
      return
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    setProfile(profileData)

    const { data: studentsData } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'alumno')
      .eq('academia_id', profileData.academia_id)

    setStudents(studentsData || [])

    const { data: templateData } = await supabase
      .from('routines')
      .select('*')
      .eq('is_template', true)
      .order('titulo')

    setTemplates(templateData || [])

    const { data: routinesData } = await supabase
      .from('routines')
      .select('*')
      .eq('profe_id', user.id)
      .eq('is_template', false)
      .order('created_at', { ascending: false })

    setMyRoutines(routinesData || [])

    const allIds = [
      ...(templateData || []).map((r) => r.id),
      ...(routinesData || []).map((r) => r.id),
    ]

    if (allIds.length > 0) {
      const { data: exData } = await supabase
        .from('routine_exercises')
        .select('*')
        .in('routine_id', allIds)
        .order('orden')

      setExercises(exData || [])
    } else {
      setExercises([])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredTemplates = useMemo(() => {
    return templates.filter((r) => {
      const q = search.toLowerCase()

      const matchesSearch =
        r.titulo?.toLowerCase().includes(q) ||
        r.descripcion?.toLowerCase().includes(q) ||
        r.categoria?.toLowerCase().includes(q) ||
        r.objetivo?.toLowerCase().includes(q)

      const matchesLevel =
        levelFilter === 'Todos' ||
        r.nivel === levelFilter

      return matchesSearch && matchesLevel
    })
  }, [templates, search, levelFilter])

  function getExercises(routineId: string) {
    return exercises
      .filter((e) => e.routine_id === routineId)
      .sort((a, b) => (a.orden || 0) - (b.orden || 0))
  }

  function alreadyUsed(templateId: string) {
    return myRoutines.some(
      (r) => r.template_source_id === templateId
    )
  }

  async function createFromTemplate(templateId: string) {
    if (!profile) return

    setSaving(true)
    setError('')
    setMessage('')

    const template = templates.find((r) => r.id === templateId)

    if (!template) {
      setSaving(false)
      return
    }

    if (alreadyUsed(templateId)) {
      setError('Ya agregaste esta plantilla.')
      setSaving(false)
      return
    }

    const { data: newRoutine, error } = await supabase
      .from('routines')
      .insert({
        titulo: template.titulo,
        descripcion: template.descripcion,
        nivel: template.nivel,
        categoria: template.categoria,
        objetivo: template.objetivo,
        duracion_min: template.duracion_min,
        template_source_id: template.id,
        is_template: false,
        profe_id: profile.id,
        academia_id: profile.academia_id,
      })
      .select('*')
      .single()

    if (error || !newRoutine) {
      setError(error?.message || 'Error al crear rutina.')
      setSaving(false)
      return
    }

    const templateExercises = getExercises(template.id)

    if (templateExercises.length > 0) {
      const payload = templateExercises.map((e) => ({
        routine_id: newRoutine.id,
        nombre: e.nombre,
        sets: e.sets,
        reps: e.reps,
        descanso: e.descanso,
        video_url: e.video_url,
        orden: e.orden,
        notas: e.notas,
      }))

      await supabase
        .from('routine_exercises')
        .insert(payload)
    }

    setSelectedRoutineId(newRoutine.id)
    setMessage('Rutina agregada.')
    await loadData()
    setSaving(false)
  }

  async function createCustomRoutine() {
    if (!profile || !customTitle.trim()) return

    setSaving(true)
    setError('')
    setMessage('')

    const { error } = await supabase
      .from('routines')
      .insert({
        titulo: customTitle.trim(),
        descripcion: customDescription.trim() || null,
        is_template: false,
        profe_id: profile.id,
        academia_id: profile.academia_id,
      })

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    setCustomTitle('')
    setCustomDescription('')
    setMessage('Rutina creada.')
    await loadData()
    setSaving(false)
  }

  async function assignRoutine() {
    if (!selectedRoutineId || !selectedStudentId) {
      setError('Selecciona rutina y alumno.')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')

    const { error } = await supabase
      .from('student_routines')
      .insert({
        routine_id: selectedRoutineId,
        student_id: selectedStudentId,
      })

    if (error) {
      if (error.code === '23505') {
        setError('Esta rutina ya está asignada.')
      } else {
        setError(error.message)
      }

      setSaving(false)
      return
    }

    setMessage('Rutina asignada.')
    setSaving(false)
  }

  function startEditExercise(exercise: Exercise) {
    setEditingExerciseId(exercise.id)
    setEditName(exercise.nombre)
    setEditSets(String(exercise.sets || 3))
    setEditReps(String(exercise.reps || 10))
    setEditRest(String(exercise.descanso || 60))
    setEditVideo(exercise.video_url || '')
  }

  function cancelEditExercise() {
    setEditingExerciseId(null)
    setEditName('')
    setEditSets('')
    setEditReps('')
    setEditRest('')
    setEditVideo('')
  }

  async function saveExercise(exerciseId: string) {
    if (!editName.trim()) {
      setError('El ejercicio necesita un nombre.')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')

    const { error } = await supabase
      .from('routine_exercises')
      .update({
        nombre: editName.trim(),
        sets: Number(editSets) || 1,
        reps: Number(editReps) || 1,
        descanso: Number(editRest) || 60,
        video_url: editVideo.trim() || null,
      })
      .eq('id', exerciseId)

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    cancelEditExercise()
    setMessage('Ejercicio actualizado.')
    await loadData()
    setSaving(false)
  }

  async function deleteExercise(exerciseId: string) {
    const confirmDelete = window.confirm('¿Eliminar ejercicio?')

    if (!confirmDelete) return

    setSaving(true)
    setError('')
    setMessage('')

    const { error } = await supabase
      .from('routine_exercises')
      .delete()
      .eq('id', exerciseId)

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    setMessage('Ejercicio eliminado.')
    await loadData()
    setSaving(false)
  }

  async function deleteRoutine(routineId: string) {
    const confirmDelete = window.confirm(
      '¿Seguro que quieres eliminar esta rutina? También se eliminarán sus ejercicios y asignaciones.'
    )

    if (!confirmDelete) return

    setSaving(true)
    setError('')
    setMessage('')

    const { error } = await supabase
      .from('routines')
      .delete()
      .eq('id', routineId)
      .eq('profe_id', profile?.id)

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    setMessage('Rutina eliminada.')
    await loadData()
    setSaving(false)
  }

  if (loading) {
    return (
      <div style={styles.page}>
        Cargando...
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Rutinas</h1>
          <p style={styles.subtitle}>Biblioteca inteligente CALFIT</p>
        </div>

        <button style={styles.refresh} onClick={loadData}>
          Actualizar
        </button>
      </div>

      {message && <div style={styles.success}>{message}</div>}
      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.filters}>
        <input
          style={styles.input}
          placeholder="Buscar rutina..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          style={styles.select}
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
        >
          <option>Todos</option>
          <option>Principiante</option>
          <option>Intermedio</option>
          <option>Avanzado</option>
        </select>
      </div>

      <div style={styles.templatesGrid}>
        {filteredTemplates.map((routine) => (
          <div key={routine.id} style={styles.card}>
            <div style={styles.tags}>
              <span style={styles.badge}>{routine.nivel}</span>
              <span style={styles.darkBadge}>{routine.categoria}</span>
            </div>

            <h2 style={styles.cardTitle}>{routine.titulo}</h2>

            <p style={styles.description}>{routine.descripcion}</p>

            <p style={styles.meta}>🎯 {routine.objetivo}</p>

            <p style={styles.meta}>
              ⏱️ {routine.duracion_min} min · {getExercises(routine.id).length}{' '}
              ejercicios
            </p>

            <details>
              <summary style={{ cursor: 'pointer' }}>Ver ejercicios</summary>

              <div style={{ marginTop: 12 }}>
                {getExercises(routine.id).map((e) => (
                  <div key={e.id} style={styles.exercise}>
                    <strong>{e.nombre}</strong>
                    <span>
                      {e.sets}x{e.reps}
                    </span>
                  </div>
                ))}
              </div>
            </details>

            <button
              style={{
                ...styles.button,
                opacity: alreadyUsed(routine.id) ? 0.4 : 1,
              }}
              disabled={saving || alreadyUsed(routine.id)}
              onClick={() => createFromTemplate(routine.id)}
            >
              {alreadyUsed(routine.id) ? 'Ya agregada' : 'Usar plantilla'}
            </button>
          </div>
        ))}
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Asignar rutina</h2>

        <select
          style={styles.select}
          value={selectedRoutineId}
          onChange={(e) => setSelectedRoutineId(e.target.value)}
        >
          <option value="">Seleccionar rutina</option>

          {myRoutines.map((r) => (
            <option key={r.id} value={r.id}>
              {r.titulo}
            </option>
          ))}
        </select>

        <select
          style={styles.select}
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
        >
          <option value="">Seleccionar alumno</option>

          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name || s.email}
            </option>
          ))}
        </select>

        <button style={styles.button} onClick={assignRoutine}>
          Asignar rutina
        </button>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Crear rutina personalizada</h2>

        <input
          style={styles.input}
          placeholder="Nombre"
          value={customTitle}
          onChange={(e) => setCustomTitle(e.target.value)}
        />

        <textarea
          style={styles.textarea}
          placeholder="Descripción"
          value={customDescription}
          onChange={(e) => setCustomDescription(e.target.value)}
        />

        <button style={styles.button} onClick={createCustomRoutine}>
          Crear rutina
        </button>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Mis rutinas creadas</h2>

        {myRoutines.map((r) => (
          <div key={r.id} style={styles.myRoutine}>
            <div style={styles.routineHeader}>
              <div>
                <h3 style={{ color: '#c6ff32' }}>{r.titulo}</h3>
                <p style={{ color: '#8a8a8a' }}>{r.descripcion}</p>
              </div>

              <div style={styles.actionsRow}>
                <span style={styles.badge}>
                  {getExercises(r.id).length} ejercicios
                </span>

                <button
                  onClick={() => deleteRoutine(r.id)}
                  style={styles.deleteButton}
                >
                  Eliminar rutina
                </button>
              </div>
            </div>

            <div style={styles.exerciseEditor}>
              {getExercises(r.id).map((e) => (
                <div key={e.id} style={styles.exerciseBox}>
                  {editingExerciseId === e.id ? (
                    <>
                      <input
                        style={styles.input}
                        value={editName}
                        onChange={(ev) => setEditName(ev.target.value)}
                        placeholder="Nombre ejercicio"
                      />

                      <div style={styles.editGrid}>
                        <input
                          style={styles.input}
                          value={editSets}
                          onChange={(ev) => setEditSets(ev.target.value)}
                          placeholder="Sets"
                        />

                        <input
                          style={styles.input}
                          value={editReps}
                          onChange={(ev) => setEditReps(ev.target.value)}
                          placeholder="Reps"
                        />

                        <input
                          style={styles.input}
                          value={editRest}
                          onChange={(ev) => setEditRest(ev.target.value)}
                          placeholder="Descanso"
                        />
                      </div>

                      <input
                        style={styles.input}
                        placeholder="Video URL"
                        value={editVideo}
                        onChange={(ev) => setEditVideo(ev.target.value)}
                      />

                      <div style={styles.actionsRow}>
                        <button
                          style={styles.button}
                          onClick={() => saveExercise(e.id)}
                        >
                          Guardar
                        </button>

                        <button
                          style={styles.deleteButton}
                          onClick={cancelEditExercise}
                        >
                          Cancelar
                        </button>
                      </div>
                    </>
                  ) : (
                    <div style={styles.exerciseView}>
                      <div>
                        <strong>{e.nombre}</strong>

                        <p style={{ color: '#8a8a8a' }}>
                          {e.sets}x{e.reps} · {e.descanso}s
                        </p>

                        {e.video_url && (
                          <p style={{ color: '#c6ff32', fontSize: 12 }}>
                            🎥 Video agregado
                          </p>
                        )}
                      </div>

                      <div style={styles.actionsRow}>
                        <button
                          style={styles.editButton}
                          onClick={() => startEditExercise(e)}
                        >
                          Editar
                        </button>

                        <button
                          style={styles.deleteButton}
                          onClick={() => deleteExercise(e.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: 30,
    color: 'white',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },

  title: {
    fontSize: 42,
    fontWeight: 900,
  },

  subtitle: {
    color: '#8a8a8a',
  },

  refresh: {
    border: '1px solid #c6ff32',
    background: 'transparent',
    color: '#c6ff32',
    padding: '10px 16px',
    borderRadius: 12,
    cursor: 'pointer',
  },

  success: {
    background: 'rgba(0,255,100,.1)',
    border: '1px solid #00ff88',
    color: '#00ff88',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },

  error: {
    background: 'rgba(255,0,0,.1)',
    border: '1px solid red',
    color: '#ff8a8a',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },

  filters: {
    display: 'flex',
    gap: 12,
    marginBottom: 24,
  },

  input: {
    flex: 1,
    background: '#111',
    border: '1px solid #333',
    borderRadius: 12,
    color: 'white',
    padding: 14,
    width: '100%',
    boxSizing: 'border-box',
    marginBottom: 12,
  },

  textarea: {
    width: '100%',
    minHeight: 100,
    background: '#111',
    border: '1px solid #333',
    borderRadius: 12,
    color: 'white',
    padding: 14,
    marginBottom: 12,
    boxSizing: 'border-box',
  },

  select: {
    background: '#111',
    border: '1px solid #333',
    borderRadius: 12,
    color: 'white',
    padding: 14,
    width: '100%',
    marginBottom: 12,
  },

  templatesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))',
    gap: 20,
    marginBottom: 30,
  },

  card: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: 20,
    padding: 20,
  },

  tags: {
    display: 'flex',
    gap: 8,
    marginBottom: 12,
  },

  badge: {
    background: '#c6ff32',
    color: 'black',
    padding: '6px 12px',
    borderRadius: 999,
    fontWeight: 800,
    fontSize: 12,
  },

  darkBadge: {
    background: '#222',
    color: '#ccc',
    padding: '6px 12px',
    borderRadius: 999,
    fontSize: 12,
  },

  cardTitle: {
    color: '#c6ff32',
    fontSize: 30,
  },

  description: {
    color: '#ddd',
  },

  meta: {
    color: '#8a8a8a',
  },

  button: {
    width: '100%',
    background: '#c6ff32',
    color: 'black',
    border: 'none',
    borderRadius: 14,
    padding: 14,
    fontWeight: 900,
    cursor: 'pointer',
    marginTop: 14,
  },

  section: {
    background: '#111',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 28,
    marginBottom: 20,
  },

  myRoutine: {
    background: '#0d0d0d',
    border: '1px solid #222',
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
  },

  routineHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 20,
  },

  actionsRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
  },

  deleteButton: {
    background: '#3b0b0b',
    color: '#ff7b7b',
    border: '1px solid #7f1d1d',
    borderRadius: 10,
    padding: '8px 12px',
    cursor: 'pointer',
    fontWeight: 800,
  },

  editButton: {
    background: '#1f2937',
    color: '#d1d5db',
    border: '1px solid #374151',
    borderRadius: 10,
    padding: '8px 12px',
    cursor: 'pointer',
    fontWeight: 800,
  },

  exercise: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 8,
    color: '#ddd',
  },

  exerciseEditor: {
    marginTop: 20,
    display: 'grid',
    gap: 12,
  },

  exerciseBox: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: 14,
    padding: 14,
  },

  exerciseView: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },

  editGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 10,
  },
}