'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Rutina = { id: number; org_id: number; alumno_id: string; nombre: string; descripcion: string | null; categoria: string; activa: boolean; created_at: string }
type Ejercicio = { id: number; rutina_id: number; nombre: string; tipo: string; series: number | null; reps: string | null; descanso_s: number | null; video_url: string | null; notas: string | null; orden: number | null }

type Sesion = { id: number; rutina_id: number; completada: boolean; created_at: string }

export default function AlumnoRutinasPage() {
  const supabase = useMemo(() => createClient(), [])
  const [userId, setUserId] = useState('')
  const [rutinas, setRutinas] = useState<Rutina[]>([])
  const [ejercicios, setEjercicios] = useState<Record<number, Ejercicio[]>>({})
  const [sesiones, setSesiones] = useState<Sesion[]>([])
  const [selectedRutina, setSelectedRutina] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timer, setTimer] = useState(0)
  const [running, setRunning] = useState(false)

  useEffect(() => { load() }, [])
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setTimer(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [running])

  async function load() {
    setLoading(true); setError('')
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) { setError('Sesión no encontrada'); setLoading(false); return }
    setUserId(uid)

    const { data: ruts, error: rutError } = await supabase.from('rutinas').select('*').eq('alumno_id', uid).eq('activa', true).order('created_at', { ascending: false })
    if (rutError) { setError(rutError.message); setLoading(false); return }
    const list = (ruts || []) as Rutina[]
    setRutinas(list)
    setSelectedRutina(prev => prev || list[0]?.id || null)

    if (list.length) {
      const { data: exs } = await supabase.from('ejercicios').select('*').in('rutina_id', list.map(r => r.id)).order('orden')
      const grouped: Record<number, Ejercicio[]> = {}
      ;((exs || []) as Ejercicio[]).forEach(e => { grouped[e.rutina_id] = [...(grouped[e.rutina_id] || []), e] })
      setEjercicios(grouped)
      const { data: ses } = await supabase.from('sesiones').select('id,rutina_id,completada,created_at').eq('alumno_id', uid).order('created_at', { ascending: false }).limit(20)
      setSesiones((ses || []) as Sesion[])
    }
    setLoading(false)
  }

  async function completeRutina(r: Rutina) {
    setError('')
    const minutes = Math.max(1, Math.round(timer / 60))
    const { error: sesError } = await supabase.from('sesiones').insert({ org_id: r.org_id, alumno_id: userId, rutina_id: r.id, completada: true, duracion_min: minutes })
    if (sesError) setError(sesError.message)
    else { setRunning(false); setTimer(0); await load() }
  }

  const selected = rutinas.find(r => r.id === selectedRutina) || rutinas[0]
  const mm = String(Math.floor(timer / 60)).padStart(2, '0')
  const ss = String(timer % 60).padStart(2, '0')

  if (loading) return <div className="loader">Cargando tus rutinas...</div>

  return (
    <div>
      <div className="page-title">MIS RUTINAS</div>
      <div className="page-sub">Entrena, usa el timer y registra tus sesiones completadas.</div>
      {error && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {!rutinas.length ? <div className="card" style={{ textAlign: 'center', padding: 60, color: '#444' }}>Tu profesor aún no te asigna rutinas.</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 18 }}>
          <div className="card">
            <div style={{ fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', color: '#666', marginBottom: 14 }}>Rutinas activas</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rutinas.map(r => <button key={r.id} onClick={() => setSelectedRutina(r.id)} className="btn btn-ghost" style={{ justifyContent: 'flex-start', borderColor: selected?.id === r.id ? '#c8f542' : 'rgba(255,255,255,0.1)', color: selected?.id === r.id ? '#c8f542' : '#888' }}>{r.nombre}</button>)}
            </div>
          </div>

          <div className="card">
            {selected && <>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'flex-start', marginBottom: 18 }}>
                <div>
                  <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 38, letterSpacing: 2, margin: 0 }}>{selected.nombre}</h2>
                  <div style={{ color: '#666', fontSize: 13 }}>{selected.descripcion || 'Sin descripción'} · {selected.categoria}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'Bebas Neue', fontSize: 34, color: '#c8f542' }}>{mm}:{ss}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost" onClick={() => setRunning(v => !v)}>{running ? 'PAUSAR' : 'INICIAR'}</button>
                    <button className="btn btn-primary" onClick={() => completeRutina(selected)}>COMPLETAR</button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                {(ejercicios[selected.id] || []).map((ex, i) => <div key={ex.id} style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: 12, alignItems: 'center', padding: 14, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, background: '#111' }}>
                  <div style={{ color: '#c8f542', fontFamily: 'Bebas Neue', fontSize: 28 }}>{i + 1}</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{ex.nombre}</div>
                    <div style={{ color: '#666', fontSize: 12 }}>{ex.series} series · {ex.reps} reps · descanso {ex.descanso_s}s</div>
                  </div>
                  {ex.video_url && <a href={ex.video_url} target="_blank" style={{ color: '#c8f542', fontSize: 12 }}>Ver video</a>}
                </div>)}
              </div>
            </>}
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 18 }}>
        <div style={{ fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', color: '#666', marginBottom: 14 }}>Últimas sesiones</div>
        {!sesiones.length ? <div style={{ color: '#555', fontSize: 13 }}>Aún no registras sesiones.</div> : sesiones.map(s => <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '10px 0' }}><span>{rutinas.find(r => r.id === s.rutina_id)?.nombre || 'Rutina'}</span><span className="badge badge-success">Completada</span></div>)}
      </div>
    </div>
  )
}
