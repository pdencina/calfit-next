'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Routine = {
  id: string
  titulo: string | null
  descripcion: string | null
  objetivo?: string | null
  duracion_min?: number | null
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

  const [studentId, setStudentId] =
    useState('')

  const [assigned, setAssigned] =
    useState<Assigned[]>([])

  const [exercises, setExercises] =
    useState<Record<string, Exercise[]>>(
      {}
    )

  const [loading, setLoading] =
    useState(true)

  const [message, setMessage] =
    useState('')

  const [notes, setNotes] =
    useState<Record<string, string>>({})

  const [activeRoutineId, setActiveRoutineId] =
    useState<string | null>(null)

  const [timer, setTimer] =
    useState<number | null>(null)

  const [exerciseChecks, setExerciseChecks] =
    useState<Record<string, boolean>>({})

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (timer === null) return

    if (timer <= 0) {
      const audio = new Audio(
        '/notification.mp3'
      )

      audio.play().catch(() => {})

      setTimer(null)
      return
    }

    const interval = setInterval(() => {
      setTimer((prev) =>
        prev !== null ? prev - 1 : null
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [timer])

  async function loadData() {
    setLoading(true)
    setMessage('')

    const { data: auth } =
      await supabase.auth.getUser()

    if (!auth.user) {
      setMessage('No hay sesión activa.')
      setLoading(false)
      return
    }

    setStudentId(auth.user.id)

    const { data: rows, error } =
      await supabase
        .from('student_routines')
        .select(`
          id,
          routine_id,
          routines (
            id,
            titulo,
            descripcion,
            objetivo,
            duracion_min
          )
        `)
        .eq('student_id', auth.user.id)
        .order('assigned_at', {
          ascending: false,
        })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    const assignedRows =
      (rows || []) as Assigned[]

    setAssigned(assignedRows)

    const routineIds =
      assignedRows.map(
        (r) => r.routine_id
      )

    if (routineIds.length) {
      const { data: exerciseRows } =
        await supabase
          .from('routine_exercises')
          .select('*')
          .in(
            'routine_id',
            routineIds
          )
          .order('orden', {
            ascending: true,
          })

      const grouped: Record<
        string,
        Exercise[]
      > = {}

      for (const ex of exerciseRows || []) {
        if (!grouped[ex.routine_id]) {
          grouped[ex.routine_id] = []
        }

        grouped[ex.routine_id].push(ex)
      }

      setExercises(grouped)
    }

    setLoading(false)
  }

  function toggleExercise(
    exerciseId: string
  ) {
    setExerciseChecks({
      ...exerciseChecks,
      [exerciseId]:
        !exerciseChecks[exerciseId],
    })
  }

  function startRestTimer(
    seconds: number
  ) {
    setTimer(seconds)
  }

  async function completeRoutine(
    routineId: string
  ) {
    setMessage('')

    const checkedCount =
      Object.values(exerciseChecks).filter(
        Boolean
      ).length

    const durationEstimate =
      checkedCount * 4

    const { error } = await supabase
      .from('workout_sessions')
      .insert({
        student_id: studentId,
        routine_id: routineId,
        completed: true,
        duration_minutes:
          durationEstimate,
        notes:
          notes[routineId] || null,
      })

    if (error) {
      setMessage(error.message)
      return
    }

    setNotes({
      ...notes,
      [routineId]: '',
    })

    setExerciseChecks({})

    setMessage(
      '🔥 Entrenamiento completado correctamente.'
    )
  }

  const totalCompletedExercises =
    useMemo(() => {
      return Object.values(
        exerciseChecks
      ).filter(Boolean).length
    }, [exerciseChecks])

  if (loading) {
    return (
      <Page>
        <Card>
          Cargando tus rutinas...
        </Card>
      </Page>
    )
  }

  return (
    <Page>
      <div style={hero}>
        <div>
          <h1 style={h1}>
            Mis Entrenamientos
          </h1>

          <p style={muted}>
            Completa tus ejercicios y
            registra tu progreso.
          </p>
        </div>

        <div style={stats}>
          ✅ {totalCompletedExercises}{' '}
          ejercicios completados
        </div>
      </div>

      {timer !== null && (
        <div style={timerCard}>
          ⏱️ Descanso: {timer}s
        </div>
      )}

      {message && (
        <div style={notice}>
          {message}
        </div>
      )}

      {assigned.length === 0 && (
        <Card>
          <h2 style={h2}>
            Aún no tienes rutinas
          </h2>

          <p style={muted}>
            Cuando tu coach te asigne
            una rutina aparecerá aquí.
          </p>
        </Card>
      )}

      <div style={routineList}>
        {assigned.map((item) => {
          const routine =
            Array.isArray(item.routines)
              ? item.routines[0]
              : item.routines

          const routineExercises =
            exercises[
              item.routine_id
            ] || []

          return (
            <Card key={item.id}>
              <div
                style={routineHeader}
              >
                <div>
                  <h2 style={h2}>
                    {routine?.titulo ||
                      'Rutina'}
                  </h2>

                  <p style={muted}>
                    {
                      routine?.descripcion
                    }
                  </p>

                  {routine?.objetivo && (
                    <p
                      style={
                        goal
                      }
                    >
                      🎯{' '}
                      {
                        routine.objetivo
                      }
                    </p>
                  )}
                </div>

                <div style={duration}>
                  ⏱️{' '}
                  {routine?.duracion_min ||
                    45}{' '}
                  min
                </div>
              </div>

              <button
                style={startButton}
                onClick={() =>
                  setActiveRoutineId(
                    item.routine_id
                  )
                }
              >
                ▶ Iniciar entrenamiento
              </button>

              {activeRoutineId ===
                item.routine_id && (
                <>
                  <div
                    style={{
                      marginTop: 24,
                    }}
                  >
                    {routineExercises.map(
                      (
                        ex,
                        idx
                      ) => (
                        <div
                          key={
                            ex.id
                          }
                          style={
                            exerciseCard
                          }
                        >
                          <div
                            style={
                              exerciseTop
                            }
                          >
                            <div>
                              <strong
                                style={
                                  exerciseTitle
                                }
                              >
                                {idx +
                                  1}
                                .{' '}
                                {
                                  ex.nombre
                                }
                              </strong>

                              <p
                                style={
                                  exerciseMeta
                                }
                              >
                                {
                                  ex.sets
                                }
                                x
                                {
                                  ex.reps
                                }{' '}
                                ·{' '}
                                {
                                  ex.descanso
                                }
                                s
                              </p>
                            </div>

                            <input
                              type="checkbox"
                              checked={
                                !!exerciseChecks[
                                  ex.id
                                ]
                              }
                              onChange={() =>
                                toggleExercise(
                                  ex.id
                                )
                              }
                              style={
                                checkbox
                              }
                            />
                          </div>

                          {ex.video_url && (
                            <a
                              href={
                                ex.video_url
                              }
                              target="_blank"
                              style={
                                videoLink
                              }
                            >
                              🎥 Ver
                              video
                            </a>
                          )}

                          <button
                            style={
                              restButton
                            }
                            onClick={() =>
                              startRestTimer(
                                ex.descanso ||
                                  60
                              )
                            }
                          >
                            ⏱️
                            Iniciar
                            descanso
                          </button>
                        </div>
                      )
                    )}
                  </div>

                  <textarea
                    style={textarea}
                    placeholder="Notas del entrenamiento..."
                    value={
                      notes[
                        item
                          .routine_id
                      ] || ''
                    }
                    onChange={(
                      e
                    ) =>
                      setNotes({
                        ...notes,
                        [item
                          .routine_id]:
                          e.target
                            .value,
                      })
                    }
                  />

                  <button
                    onClick={() =>
                      completeRoutine(
                        item.routine_id
                      )
                    }
                    style={
                      completeButton
                    }
                  >
                    ✅ Finalizar
                    entrenamiento
                  </button>
                </>
              )}
            </Card>
          )
        })}
      </div>
    </Page>
  )
}

function Page({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        padding: 32,
        color: '#fff',
      }}
    >
      {children}
    </div>
  )
}

function Card({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={card}>
      {children}
    </div>
  )
}

const hero = {
  display: 'flex',
  justifyContent:
    'space-between',
  alignItems: 'center',
  gap: 20,
  marginBottom: 24,
}

const h1 = {
  margin: 0,
  fontSize: 40,
  color: '#fff',
  fontWeight: 900,
}

const h2 = {
  margin: '0 0 10px',
  fontSize: 28,
  color: '#c8f542',
}

const muted = {
  margin: 0,
  color: '#888',
  fontSize: 14,
}

const stats = {
  background:
    'linear-gradient(135deg,#c8f542,#9eff00)',
  color: '#000',
  padding: '16px 20px',
  borderRadius: 18,
  fontWeight: 900,
}

const timerCard = {
  background:
    'rgba(200,245,66,.12)',
  border:
    '1px solid rgba(200,245,66,.4)',
  color: '#c8f542',
  borderRadius: 18,
  padding: 18,
  marginBottom: 20,
  fontSize: 24,
  fontWeight: 900,
  textAlign: 'center' as const,
}

const card = {
  background: '#111',
  border:
    '1px solid rgba(255,255,255,0.08)',
  borderRadius: 24,
  padding: 24,
}

const routineList = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(360px, 1fr))',
  gap: 24,
}

const routineHeader = {
  display: 'flex',
  justifyContent:
    'space-between',
  gap: 20,
  alignItems: 'center',
}

const duration = {
  background: '#1d1d1d',
  padding: '12px 14px',
  borderRadius: 14,
  color: '#c8f542',
  fontWeight: 800,
  whiteSpace: 'nowrap' as const,
}

const startButton = {
  width: '100%',
  background: '#c8f542',
  color: '#000',
  border: 0,
  borderRadius: 14,
  padding: 16,
  fontWeight: 900,
  cursor: 'pointer',
  marginTop: 20,
}

const completeButton = {
  width: '100%',
  background:
    'linear-gradient(135deg,#00ff88,#00d26a)',
  color: '#000',
  border: 0,
  borderRadius: 16,
  padding: 18,
  fontWeight: 900,
  cursor: 'pointer',
  marginTop: 14,
  fontSize: 16,
}

const exerciseCard = {
  background: '#0a0a0a',
  border:
    '1px solid rgba(255,255,255,.06)',
  borderRadius: 18,
  padding: 18,
  marginBottom: 14,
}

const exerciseTop = {
  display: 'flex',
  justifyContent:
    'space-between',
  alignItems: 'center',
  gap: 20,
}

const exerciseTitle = {
  color: '#fff',
  fontSize: 18,
}

const exerciseMeta = {
  color: '#8a8a8a',
  marginTop: 8,
}

const checkbox = {
  width: 22,
  height: 22,
  cursor: 'pointer',
}

const videoLink = {
  display: 'inline-block',
  marginTop: 12,
  color: '#c8f542',
  textDecoration: 'none',
  fontWeight: 700,
}

const restButton = {
  marginTop: 14,
  background: '#1b1b1b',
  color: '#fff',
  border:
    '1px solid rgba(255,255,255,.08)',
  borderRadius: 12,
  padding: '10px 14px',
  cursor: 'pointer',
}

const textarea = {
  width: '100%',
  background: '#050505',
  border:
    '1px solid rgba(255,255,255,0.12)',
  borderRadius: 14,
  padding: 14,
  color: '#fff',
  boxSizing: 'border-box' as const,
  minHeight: 100,
  marginTop: 20,
  marginBottom: 14,
}

const notice = {
  background:
    'rgba(200,245,66,0.08)',
  border:
    '1px solid rgba(200,245,66,0.25)',
  color: '#c8f542',
  borderRadius: 14,
  padding: 14,
  marginBottom: 20,
}

const goal = {
  color: '#ddd',
  marginTop: 12,
  fontSize: 14,
}