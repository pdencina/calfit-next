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

  async function loadData() {
    setLoading(true)
    setMessage('')
    setError('')

    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user

    if (!user) {
      window.location.href = '/login'
      return
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError || !profileData) {
      setError('No pude cargar el perfil del profesor.')
      setLoading(false)
      return
    }

    setProfile(profileData)

    const { data: studentsData } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'alumno')
      .eq('academia_id', profileData.academia_id)
      .order('full_name')

    setStudents(studentsData ?? [])

    const { data: templateData } = await supabase
      .from('routines')
      .select('*')
      .eq('is_template', true)
      .order('nivel')
      .order('titulo')

    setTemplates(templateData ?? [])

    const { data: routinesData } = await supabase
      .from('routines')
      .select('*')
      .eq('profe_id', user.id)
      .eq('is_template', false)
      .order('created_at', { ascending: false })

    setMyRoutines(routinesData ?? [])

    const routineIds = [
      ...(templateData ?? []).map((r) => r.id),
      ...(routinesData ?? []).map((r) => r.id),
    ]

    if (routineIds.length > 0) {
      const { data: exData } = await supabase
        .from('routine_exercises')
        .select('*')
        .in('routine_id', routineIds)
        .order('orden')

      setExercises(exData ?? [])
    } else {
      setExercises([])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase()

    return templates.filter((r) => {
      const matchesSearch =
        !q ||
        r.titulo?.toLowerCase().includes(q) ||
        r.descripcion?.toLowerCase().includes(q) ||
        r.categoria?.toLowerCase().includes(q) ||
        r.objetivo?.toLowerCase().includes(q)

      const matchesLevel =
        levelFilter === 'Todos' || r.nivel === levelFilter

      return matchesSearch && matchesLevel
    })
  }, [templates, search, levelFilter])

  function getExercises(routineId: string) {
    return exercises.filter((e) => e.routine_id === routineId)
  }

  function isTemplateAlreadyUsed(templateId: string) {
    return myRoutines.some(
      (routine) => routine.template_source_id === templateId
    )
  }

  async function createFromTemplate(templateId: string) {
    if (!profile) return

    setSaving(true)
    setMessage('')
    setError('')

    const template = templates.find((r) => r.id === templateId)

    if (!template) {
      setError('Selecciona una plantilla válida.')
      setSaving(false)
      return
    }

    const alreadyExists = isTemplateAlreadyUsed(templateId)

    if (alreadyExists) {
      setError('Ya agregaste esta plantilla a tus rutinas.')
      setSaving(false)
      return
    }

    const { data: newRoutine, error: routineError } = await supabase
      .from('routines')
      .insert({
        titulo: template.titulo,
        descripcion: template.descripcion,
        nivel: template.nivel,
        categoria: template.categoria,
        objetivo: template.objetivo,
        duracion_min: template.duracion_min,
        is_template: false,
        template_source_id: template.id,
        profe_id: profile.id,
        academia_id: profile.academia_id,
      })
      .select('*')
      .single()

    if (routineError || !newRoutine) {
      if (routineError?.code === '23505') {
        setError('Ya agregaste esta plantilla a tus rutinas.')
      } else {
        setError(
          routineError?.message ||
            'No pude crear la rutina desde plantilla.'
        )
      }

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

      const { error: exError } = await supabase
        .from('routine_exercises')
        .insert(payload)

      if (exError) {
        setError(exError.message)
        setSaving(false)
        return
      }
    }

    setSelectedRoutineId(newRoutine.id)
    setMessage(`Plantilla "${template.titulo}" agregada a tus rutinas.`)

    await loadData()

    setSaving(false)
  }

  async function createCustomRoutine() {
    if (!profile || !customTitle.trim()) return

    setSaving(true)
    setMessage('')
    setError('')

    const { error: insertError } = await supabase
      .from('routines')
      .insert({
        titulo: customTitle.trim(),
        descripcion: customDescription.trim() || null,
        is_template: false,
        profe_id: profile.id,
        academia_id: profile.academia_id,
        nivel: 'Personalizada',
        categoria: 'Custom',
      })

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    setCustomTitle('')
    setCustomDescription('')
    setMessage('Rutina personalizada creada.')

    await loadData()

    setSaving(false)
  }

  async function assignRoutine() {
    if (!selectedRoutineId || !selectedStudentId) {
      setError('Selecciona una rutina y un alumno.')
      return
    }

    setSaving(true)
    setMessage('')
    setError('')

    const { error: assignError } = await supabase
      .from('student_routines')
      .insert({
        routine_id: selectedRoutineId,
        student_id: selectedStudentId,
      })

    if (assignError) {
      if (assignError.code === '23505') {
        setError('Esta rutina ya está asignada a este alumno.')
      } else {
        setError(assignError.message)
      }

      setSaving(false)
      return
    }

    setMessage('Rutina asignada correctamente al alumno.')
    setSaving(false)
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <h1 style={styles.title}>Cargando rutinas...</h1>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Rutinas</h1>
          <p style={styles.subtitle}>
            Elige plantillas populares, personalízalas y asígnalas a tus alumnos.
          </p>
        </div>

        <button style={styles.outlineButton} onClick={loadData}>
          Actualizar
        </button>
      </div>

      {message && <div style={styles.success}>{message}</div>}
      {error && <div style={styles.error}>{error}</div>}

      <section style={styles.gridTwo}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Biblioteca CALFIT</h2>
          <p style={styles.muted}>
            Rutinas listas para usar. El profe solo selecciona y asigna.
          </p>

          <div style={styles.filters}>
            <input
              style={styles.input}
              placeholder="Buscar por nombre, objetivo o categoría"
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

          <div style={styles.templateGrid}>
            {filteredTemplates.map((routine) => {
              const alreadyUsed = isTemplateAlreadyUsed(routine.id)

              return (
                <article key={routine.id} style={styles.templateCard}>
                  <div style={styles.badgeRow}>
                    <span style={styles.badge}>
                      {routine.nivel ?? 'Nivel'}
                    </span>

                    <span style={styles.badgeDark}>
                      {routine.categoria ?? 'Calistenia'}
                    </span>
                  </div>

                  <h3 style={styles.templateTitle}>{routine.titulo}</h3>

                  <p style={styles.templateDesc}>
                    {routine.descripcion}
                  </p>

                  <p style={styles.goal}>
                    🎯 {routine.objetivo ?? 'Entrenamiento general'}
                  </p>

                  <p style={styles.goal}>
                    ⏱️ {routine.duracion_min ?? 45} min ·{' '}
                    {getExercises(routine.id).length} ejercicios
                  </p>

                  <details style={styles.details}>
                    <summary>Ver ejercicios</summary>

                    <div style={styles.exerciseList}>
                      {getExercises(routine.id).map((e) => (
                        <div key={e.id} style={styles.exerciseItem}>
                          <strong>{e.nombre}</strong>
                          <span>
                            {e.sets}x{e.reps} · descanso {e.descanso}s
                          </span>
                        </div>
                      ))}
                    </div>
                  </details>

                  <button
                    style={{
                      ...styles.smallButton,
                      opacity: alreadyUsed ? 0.45 : 1,
                      cursor: alreadyUsed ? 'not-allowed' : 'pointer',
                    }}
                    disabled={saving || alreadyUsed}
                    onClick={() => createFromTemplate(routine.id)}
                  >
                    {alreadyUsed ? 'Ya agregada' : 'Usar plantilla'}
                  </button>
                </article>
              )
            })}
          </div>
        </div>

        <aside style={styles.card}>
          <h2 style={styles.cardTitle}>Asignar rutina</h2>
          <p style={styles.muted}>
            Selecciona una rutina creada desde plantilla y un alumno.
          </p>

          <label style={styles.label}>Rutina</label>

          <select
            style={styles.selectFull}
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

          <label style={styles.label}>Alumno</label>

          <select
            style={styles.selectFull}
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

          <button
            style={styles.button}
            disabled={saving}
            onClick={assignRoutine}
          >
            {saving ? 'Procesando...' : 'Asignar rutina'}
          </button>

          <div style={styles.divider} />

          <h2 style={styles.cardTitle}>Crear personalizada</h2>

          <input
            style={styles.input}
            placeholder="Nombre de la rutina"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
          />

          <textarea
            style={styles.textarea}
            placeholder="Descripción"
            value={customDescription}
            onChange={(e) => setCustomDescription(e.target.value)}
          />

          <button
            style={styles.button}
            disabled={saving}
            onClick={createCustomRoutine}
          >
            Crear rutina
          </button>
        </aside>
      </section>

      <section style={styles.card}>
        <h2 style={styles.cardTitle}>Mis rutinas creadas</h2>

        {myRoutines.length === 0 ? (
          <p style={styles.muted}>
            Aún no tienes rutinas. Usa una plantilla para comenzar rápido.
          </p>
        ) : (
          <div style={styles.myList}>
            {myRoutines.map((r) => (
              <div key={r.id} style={styles.myRoutine}>
                <div>
                  <h3 style={styles.templateTitle}>{r.titulo}</h3>
                  <p style={styles.muted}>
                    {r.descripcion || 'Sin descripción'}
                  </p>
                </div>

                <span style={styles.badge}>
                  {getExercises(r.id).length} ejercicios
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: '44px',
    color: '#fff',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 42,
    margin: 0,
    fontWeight: 900,
  },
  subtitle: {
    color: '#9ca3af',
    marginTop: 8,
  },
  gridTwo: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 0.8fr',
    gap: 24,
    alignItems: 'start',
  },
  card: {
    background: '#121212',
    border: '1px solid #262626',
    borderRadius: 22,
    padding: 24,
    marginBottom: 24,
  },
  cardTitle: {
    margin: 0,
    marginBottom: 8,
    fontSize: 24,
  },
  muted: {
    color: '#8b8b8b',
    marginTop: 0,
  },
  filters: {
    display: 'grid',
    gridTemplateColumns: '1fr 180px',
    gap: 12,
    marginTop: 18,
    marginBottom: 18,
  },
  input: {
    width: '100%',
    background: '#050505',
    color: '#fff',
    border: '1px solid #303030',
    borderRadius: 12,
    padding: 14,
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    minHeight: 110,
    background: '#050505',
    color: '#fff',
    border: '1px solid #303030',
    borderRadius: 12,
    padding: 14,
    boxSizing: 'border-box',
    marginTop: 12,
  },
  select: {
    background: '#050505',
    color: '#fff',
    border: '1px solid #303030',
    borderRadius: 12,
    padding: 14,
  },
  selectFull: {
    width: '100%',
    background: '#050505',
    color: '#fff',
    border: '1px solid #303030',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  label: {
    display: 'block',
    color: '#a3a3a3',
    marginTop: 18,
    marginBottom: 8,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  templateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 14,
  },
  templateCard: {
    background: '#080808',
    border: '1px solid #2b2b2b',
    borderRadius: 18,
    padding: 18,
  },
  badgeRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    display: 'inline-block',
    background: '#c6ff32',
    color: '#000',
    borderRadius: 999,
    padding: '5px 10px',
    fontSize: 12,
    fontWeight: 900,
  },
  badgeDark: {
    display: 'inline-block',
    background: '#202020',
    color: '#d4d4d4',
    borderRadius: 999,
    padding: '5px 10px',
    fontSize: 12,
  },
  templateTitle: {
    color: '#c6ff32',
    margin: '6px 0',
    fontSize: 20,
  },
  templateDesc: {
    color: '#b6b6b6',
    minHeight: 44,
  },
  goal: {
    color: '#8b8b8b',
    margin: '6px 0',
    fontSize: 13,
  },
  details: {
    color: '#d4d4d4',
    marginTop: 12,
    marginBottom: 12,
  },
  exerciseList: {
    marginTop: 10,
    display: 'grid',
    gap: 8,
  },
  exerciseItem: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 10,
    color: '#a3a3a3',
    borderBottom: '1px solid #222',
    paddingBottom: 6,
    fontSize: 13,
  },
  button: {
    width: '100%',
    background: '#c6ff32',
    border: 'none',
    color: '#000',
    borderRadius: 12,
    padding: 15,
    fontWeight: 900,
    cursor: 'pointer',
    marginTop: 8,
  },
  smallButton: {
    width: '100%',
    background: '#c6ff32',
    border: 'none',
    color: '#000',
    borderRadius: 12,
    padding: 12,
    fontWeight: 900,
    cursor: 'pointer',
    marginTop: 10,
  },
  outlineButton: {
    background: 'transparent',
    border: '1px solid #c6ff32',
    color: '#c6ff32',
    borderRadius: 12,
    padding: '12px 18px',
    cursor: 'pointer',
  },
  success: {
    background: 'rgba(34,197,94,.12)',
    border: '1px solid #22c55e',
    color: '#86efac',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  error: {
    background: 'rgba(239,68,68,.12)',
    border: '1px solid #ef4444',
    color: '#fca5a5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    background: '#262626',
    margin: '24px 0',
  },
  myList: {
    display: 'grid',
    gap: 12,
  },
  myRoutine: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 18,
    background: '#080808',
    border: '1px solid #262626',
    borderRadius: 16,
    padding: 16,
  },
}