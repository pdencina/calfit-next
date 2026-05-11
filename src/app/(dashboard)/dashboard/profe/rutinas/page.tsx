'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Profile = { id: string; full_name: string; email: string; role: string }
type Membership = { user_id: string; org_id: number; role: string; status: string }
type Rutina = { id: number; org_id: number; alumno_id: string; profe_id: string; nombre: string; descripcion: string | null; categoria: string; activa: boolean; semana: number; created_at: string }
type Ejercicio = { id: number; rutina_id: number; nombre: string; tipo: string; series: number | null; reps: string | null; descanso_s: number | null; video_url: string | null; notas: string | null; orden: number | null }

export default function ProfeRutinasPage() {
  const supabase = useMemo(() => createClient(), [])
  const [userId, setUserId] = useState('')
  const [orgId, setOrgId] = useState<number | null>(null)
  const [students, setStudents] = useState<Profile[]>([])
  const [rutinas, setRutinas] = useState<Rutina[]>([])
  const [ejercicios, setEjercicios] = useState<Record<number, Ejercicio[]>>({})
  const [selectedStudent, setSelectedStudent] = useState('')
  const [selectedRutina, setSelectedRutina] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [categoria, setCategoria] = useState('general')
  const [exNombre, setExNombre] = useState('')
  const [exSeries, setExSeries] = useState('4')
  const [exReps, setExReps] = useState('10')
  const [exDescanso, setExDescanso] = useState('90')
  const [exVideo, setExVideo] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true); setError('')
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) { setError('Sesión no encontrada'); setLoading(false); return }
    setUserId(uid)

    const { data: org } = await supabase.from('organizations').select('id,name').eq('owner_id', uid).maybeSingle()
    let resolvedOrgId = org?.id as number | undefined

    if (!resolvedOrgId) {
      const { data: mem } = await supabase.from('memberships').select('org_id').eq('user_id', uid).in('role', ['owner','coach']).maybeSingle()
      resolvedOrgId = mem?.org_id as number | undefined
    }

    if (!resolvedOrgId) {
      setError('No encontramos tu academia. Ejecuta supabase_critical_v3.sql para crear organization/membership.')
      setLoading(false)
      return
    }
    setOrgId(resolvedOrgId)

    const { data: memberships } = await supabase.from('memberships').select('user_id,org_id,role,status').eq('org_id', resolvedOrgId).eq('role', 'alumno').eq('status', 'active')
    const studentIds = ((memberships || []) as Membership[]).map(m => m.user_id)
    if (studentIds.length) {
      const { data: profs } = await supabase.from('profiles').select('id,full_name,email,role').in('id', studentIds).order('full_name')
      setStudents((profs || []) as Profile[])
      setSelectedStudent(prev => prev || (profs?.[0]?.id ?? ''))
    } else {
      setStudents([])
    }

    const { data: rut } = await supabase.from('rutinas').select('*').eq('org_id', resolvedOrgId).order('created_at', { ascending: false })
    const rutList = (rut || []) as Rutina[]
    setRutinas(rutList)
    setSelectedRutina(prev => prev || rutList[0]?.id || null)

    if (rutList.length) {
      const { data: exs } = await supabase.from('ejercicios').select('*').in('rutina_id', rutList.map(r => r.id)).order('orden')
      const grouped: Record<number, Ejercicio[]> = {}
      ;((exs || []) as Ejercicio[]).forEach(e => { grouped[e.rutina_id] = [...(grouped[e.rutina_id] || []), e] })
      setEjercicios(grouped)
    } else {
      setEjercicios({})
    }

    setLoading(false)
  }

  async function createRutina(e: React.FormEvent) {
    e.preventDefault()
    if (!orgId || !selectedStudent || !userId) return
    setSaving(true); setError('')
    const { error: insertError } = await supabase.from('rutinas').insert({ org_id: orgId, alumno_id: selectedStudent, profe_id: userId, nombre, descripcion, categoria })
    if (insertError) setError(insertError.message)
    else { setNombre(''); setDescripcion(''); setCategoria('general'); await load() }
    setSaving(false)
  }

  async function addEjercicio(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedRutina || !exNombre.trim()) return
    setSaving(true); setError('')
    const orden = (ejercicios[selectedRutina]?.length || 0) + 1
    const { error: insertError } = await supabase.from('ejercicios').insert({
      rutina_id: selectedRutina,
      nombre: exNombre,
      tipo: 'series',
      series: Number(exSeries) || 4,
      reps: exReps,
      descanso_s: Number(exDescanso) || 90,
      video_url: exVideo || null,
      orden
    })
    if (insertError) setError(insertError.message)
    else { setExNombre(''); setExSeries('4'); setExReps('10'); setExDescanso('90'); setExVideo(''); await load() }
    setSaving(false)
  }

  const rutinasFiltradas = selectedStudent ? rutinas.filter(r => r.alumno_id === selectedStudent) : rutinas
  const selected = rutinas.find(r => r.id === selectedRutina) || rutinasFiltradas[0]

  if (loading) return <div className="loader">Cargando rutinas...</div>

  return (
    <div>
      <div className="page-title">RUTINAS</div>
      <div className="page-sub">Crea rutinas, asígnalas a alumnos y agrega ejercicios con video.</div>

      {error && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 18 }}>
        <div className="card">
          <div style={{ fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', color: '#666', marginBottom: 16 }}>Nueva rutina</div>
          {!students.length ? (
            <div style={{ color: '#666', fontSize: 13, lineHeight: 1.6 }}>Aún no tienes alumnos activos. Registra un alumno y agrégalo a tu academia desde Supabase/memberships.</div>
          ) : (
            <form onSubmit={createRutina}>
              <div className="form-group">
                <label>Alumno</label>
                <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
                  {students.map(s => <option key={s.id} value={s.id}>{s.full_name || s.email}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Nombre</label><input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Empuje semana 1" required /></div>
              <div className="form-group"><label>Categoría</label><select value={categoria} onChange={e => setCategoria(e.target.value)}><option value="general">General</option><option value="empuje">Empuje</option><option value="traccion">Tracción</option><option value="piernas">Piernas</option><option value="core">Core</option><option value="full_body">Full body</option><option value="cardio">Cardio</option></select></div>
              <div className="form-group"><label>Descripción</label><textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Indicaciones generales" rows={3} /></div>
              <button className="btn btn-primary" disabled={saving}>{saving ? 'GUARDANDO...' : 'CREAR RUTINA'}</button>
            </form>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', color: '#666' }}>Rutinas creadas</div>
            <span className="badge badge-lime">{rutinasFiltradas.length} rutinas</span>
          </div>
          {!rutinasFiltradas.length ? (
            <div style={{ textAlign: 'center', padding: '42px 0', color: '#444' }}>Sin rutinas todavía</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 18 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {rutinasFiltradas.map(r => {
                  const st = students.find(s => s.id === r.alumno_id)
                  return <button key={r.id} onClick={() => setSelectedRutina(r.id)} className="btn btn-ghost" style={{ justifyContent: 'flex-start', borderColor: selected?.id === r.id ? '#c8f542' : 'rgba(255,255,255,0.1)', color: selected?.id === r.id ? '#c8f542' : '#888' }}>
                    <span>{r.nombre}</span><span style={{ marginLeft: 'auto', fontSize: 11, color: '#555' }}>{st?.full_name || 'Alumno'}</span>
                  </button>
                })}
              </div>

              <div>
                {selected && <>
                  <h3 style={{ fontFamily: 'Bebas Neue', letterSpacing: 2, fontSize: 28 }}>{selected.nombre}</h3>
                  <div style={{ color: '#666', fontSize: 13, marginBottom: 16 }}>{selected.descripcion || 'Sin descripción'} · {selected.categoria}</div>
                  <form onSubmit={addEjercicio} style={{ display: 'grid', gridTemplateColumns: '1.5fr .5fr .5fr .5fr', gap: 10, marginBottom: 16 }}>
                    <input style={inputMini} value={exNombre} onChange={e => setExNombre(e.target.value)} placeholder="Ejercicio" required />
                    <input style={inputMini} value={exSeries} onChange={e => setExSeries(e.target.value)} placeholder="Series" />
                    <input style={inputMini} value={exReps} onChange={e => setExReps(e.target.value)} placeholder="Reps" />
                    <button className="btn btn-primary" disabled={saving}>AGREGAR</button>
                    <input style={{ ...inputMini, gridColumn: '1 / 4' }} value={exVideo} onChange={e => setExVideo(e.target.value)} placeholder="URL video opcional" />
                    <input style={inputMini} value={exDescanso} onChange={e => setExDescanso(e.target.value)} placeholder="Descanso" />
                  </form>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(ejercicios[selected.id] || []).map((ex, i) => <div key={ex.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, background: '#111' }}>
                      <div style={{ color: '#c8f542', fontFamily: 'Bebas Neue', fontSize: 24, width: 24 }}>{i + 1}</div>
                      <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>{ex.nombre}</div><div style={{ color: '#666', fontSize: 12 }}>{ex.series} series · {ex.reps} reps · descanso {ex.descanso_s}s</div></div>
                      {ex.video_url && <a href={ex.video_url} target="_blank" style={{ color: '#c8f542', fontSize: 12 }}>Video</a>}
                    </div>)}
                    {!(ejercicios[selected.id] || []).length && <div style={{ color: '#555', fontSize: 13 }}>Agrega el primer ejercicio.</div>}
                  </div>
                </>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const inputMini: React.CSSProperties = { width: '100%', padding: '10px 12px', background: '#222', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#f0efe8', outline: 'none' }
