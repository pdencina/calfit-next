'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAlumnos, getRutinasAlumno, createRutina, deleteRutina, createEjercicio, deleteEjercicio } from '@/lib/supabase/api'

const TIPOS = [
  { value: 'al_fallo', label: 'Al fallo' },
  { value: 'series',   label: 'Por series' },
  { value: 'tiempo',   label: 'Por tiempo' },
]

export default function RutinasPage() {
  const [org, setOrg]             = useState<any>(null)
  const [profeId, setProfeId]     = useState('')
  const [alumnos, setAlumnos]     = useState<any[]>([])
  const [selected, setSelected]   = useState<any>(null)
  const [rutinas, setRutinas]     = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [showNewRutina, setShowNewRutina] = useState(false)
  const [newNombre, setNewNombre] = useState('')
  const [newCat, setNewCat]       = useState('general')
  const [newDesc, setNewDesc]     = useState('')
  const [activeRutina, setActiveRutina] = useState<number|null>(null)
  const [showEjForm, setShowEjForm] = useState(false)
  const [ejForm, setEjForm]       = useState({ nombre:'', tipo:'al_fallo', series:4, reps:'', descanso_s:90, notas:'' })
  const [saving, setSaving]       = useState(false)
  const [msg, setMsg]             = useState('')

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setProfeId(user.id)
      const { data: o } = await sb.from('organizations').select('*, plans(*)').eq('owner_id', user.id).single()
      setOrg(o)
      if (o) {
        const data = await getAlumnos(sb, o.id)
        setAlumnos(data || [])
        const params = new URLSearchParams(window.location.search)
        const aid = params.get('alumno')
        if (aid) {
          const found = data?.find((a: any) => a.id === aid)
          if (found) loadRutinas(sb, found)
        }
      }
      setLoading(false)
    })
  }, [])

  async function loadRutinas(sb: any, alumno: any) {
    setSelected(alumno)
    const data = await getRutinasAlumno(sb, alumno.id).catch(() => [])
    setRutinas(data || [])
  }

  async function handleCreateRutina(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || !org) return
    setSaving(true)
    try {
      const sb = createClient()
      const r  = await createRutina(sb, org.id, selected.id, profeId, { nombre: newNombre, descripcion: newDesc, categoria: newCat })
      setRutinas(p => [...p, { ...r, ejercicios: [] }])
      setNewNombre(''); setNewDesc(''); setShowNewRutina(false)
      setMsg('✓ Rutina creada')
      setTimeout(() => setMsg(''), 3000)
    } catch (err: any) { setMsg('Error: ' + err.message) }
    finally { setSaving(false) }
  }

  async function handleDeleteRutina(id: number) {
    if (!confirm('¿Eliminar esta rutina?')) return
    await deleteRutina(createClient(), id)
    setRutinas(p => p.filter(r => r.id !== id))
  }

  async function handleAddEj(e: React.FormEvent) {
    e.preventDefault()
    if (!activeRutina) return
    setSaving(true)
    try {
      const ej = await createEjercicio(createClient(), activeRutina, ejForm)
      setRutinas(p => p.map(r => r.id === activeRutina ? { ...r, ejercicios: [...(r.ejercicios||[]), ej] } : r))
      setEjForm({ nombre:'', tipo:'al_fallo', series:4, reps:'', descanso_s:90, notas:'' })
      setShowEjForm(false); setActiveRutina(null)
    } catch (err: any) { setMsg('Error: ' + err.message) }
    finally { setSaving(false) }
  }

  async function handleDeleteEj(rutinaId: number, ejId: number) {
    await deleteEjercicio(createClient(), ejId)
    setRutinas(p => p.map(r => r.id === rutinaId ? { ...r, ejercicios: r.ejercicios.filter((e: any) => e.id !== ejId) } : r))
  }

  const init = (n: string) => n?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || '??'

  if (loading) return <div className="loader"><div className="spinner"/>Cargando...</div>

  return (
    <div>
      <div className="page-title">RUTINAS</div>
      <div className="page-sub">Diseñá rutinas personalizadas para cada alumno</div>
      {msg && <div className="alert alert-success" style={{marginBottom:16}}>{msg}</div>}

      <div style={{display:'grid',gridTemplateColumns:'240px 1fr',gap:20,alignItems:'start'}}>

        {/* Alumnos */}
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          <div style={{padding:'12px 16px',borderBottom:'1px solid rgba(255,255,255,0.06)',fontSize:11,letterSpacing:2,textTransform:'uppercase',color:'#666'}}>Alumnos</div>
          {alumnos.length === 0 && (
            <div style={{padding:'24px 16px',textAlign:'center',color:'#444',fontSize:13}}>
              Sin alumnos.<br/><a href="/dashboard/profe/alumnos" style={{color:'#c8f542',fontSize:12}}>Invitá uno →</a>
            </div>
          )}
          {alumnos.map((a: any) => (
            <div key={a.id} onClick={() => loadRutinas(createClient(), a)}
              style={{display:'flex',alignItems:'center',gap:10,padding:'11px 16px',cursor:'pointer',
                background:selected?.id===a.id?'rgba(200,245,66,0.05)':'transparent',
                borderLeft:`2px solid ${selected?.id===a.id?'#c8f542':'transparent'}`,transition:'all 0.15s'}}>
              <div style={{width:30,height:30,borderRadius:'50%',background:'#c8f542',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#070707',flexShrink:0}}>{init(a.full_name)}</div>
              <div style={{minWidth:0}}>
                <div style={{fontSize:13,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.full_name}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Rutinas */}
        <div>
          {!selected ? (
            <div className="card" style={{textAlign:'center',padding:'48px 20px'}}>
              <div style={{fontSize:40,marginBottom:12,opacity:0.2}}>📋</div>
              <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:20,color:'#444',marginBottom:8}}>SELECCIONÁ UN ALUMNO</div>
              <div style={{fontSize:13,color:'#555'}}>Elegí un alumno para ver y editar sus rutinas</div>
            </div>
          ) : (
            <>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <div>
                  <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:20,letterSpacing:2,color:'#c8f542'}}>{selected.full_name}</div>
                  <div style={{fontSize:12,color:'#666'}}>{rutinas.length} rutina{rutinas.length!==1?'s':''}</div>
                </div>
                <button className="btn btn-primary" onClick={() => setShowNewRutina(!showNewRutina)}>+ Nueva rutina</button>
              </div>

              {showNewRutina && (
                <form onSubmit={handleCreateRutina} className="card" style={{marginBottom:16}}>
                  <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:18,letterSpacing:2,marginBottom:14}}>NUEVA RUTINA</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:10}}>
                    <div className="form-group" style={{margin:0}}><label>Nombre</label><input value={newNombre} onChange={e=>setNewNombre(e.target.value)} placeholder="Tracción, Empuje..." required/></div>
                    <div className="form-group" style={{margin:0}}><label>Categoría</label>
                      <select value={newCat} onChange={e=>setNewCat(e.target.value)}>
                        {[['traccion','Tracción'],['empuje','Empuje'],['piernas','Piernas'],['core','Core'],['full_body','Full Body'],['cardio','Cardio'],['general','General']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group"><label>Descripción (opcional)</label><input value={newDesc} onChange={e=>setNewDesc(e.target.value)} placeholder="Enfoque de la rutina..."/></div>
                  <div style={{display:'flex',gap:8}}>
                    <button type="submit" className="btn btn-primary" disabled={saving}>Crear</button>
                    <button type="button" className="btn btn-ghost" onClick={()=>setShowNewRutina(false)}>Cancelar</button>
                  </div>
                </form>
              )}

              {rutinas.length === 0 && !showNewRutina && (
                <div className="card" style={{textAlign:'center',padding:'28px',color:'#555',fontSize:13}}>Sin rutinas — creá la primera</div>
              )}

              {rutinas.map((r: any) => (
                <div key={r.id} className="card" style={{marginBottom:14}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                    <div>
                      <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:19,letterSpacing:2,color:'#c8f542'}}>{r.nombre}</div>
                      {r.descripcion && <div style={{fontSize:12,color:'#666',marginTop:2}}>{r.descripcion}</div>}
                    </div>
                    <div style={{display:'flex',gap:6}}>
                      <button className="btn btn-ghost" style={{fontSize:12,padding:'6px 10px'}}
                        onClick={()=>{setActiveRutina(r.id);setShowEjForm(true)}}>+ Ejercicio</button>
                      <button onClick={()=>handleDeleteRutina(r.id)} style={{background:'none',border:'none',color:'#f87171',cursor:'pointer',fontSize:16,padding:'4px 6px'}}>🗑</button>
                    </div>
                  </div>

                  {showEjForm && activeRutina===r.id && (
                    <form onSubmit={handleAddEj} style={{background:'rgba(255,255,255,0.03)',borderRadius:8,padding:14,marginBottom:10}}>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:10}}>
                        <div className="form-group" style={{margin:0,gridColumn:'1/-1'}}><label>Ejercicio</label><input value={ejForm.nombre} onChange={e=>setEjForm(p=>({...p,nombre:e.target.value}))} placeholder="Muscle-up, Dominadas..." required autoFocus/></div>
                        <div className="form-group" style={{margin:0}}><label>Tipo</label>
                          <select value={ejForm.tipo} onChange={e=>setEjForm(p=>({...p,tipo:e.target.value}))}>
                            {TIPOS.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                        </div>
                        <div className="form-group" style={{margin:0}}><label>Series</label><input type="number" min={1} max={20} value={ejForm.series} onChange={e=>setEjForm(p=>({...p,series:parseInt(e.target.value)}))}/></div>
                        <div className="form-group" style={{margin:0}}><label>Reps/Tiempo</label><input value={ejForm.reps} onChange={e=>setEjForm(p=>({...p,reps:e.target.value}))} placeholder="10 reps / 30s"/></div>
                        <div className="form-group" style={{margin:0}}><label>Descanso (s)</label><input type="number" min={0} value={ejForm.descanso_s} onChange={e=>setEjForm(p=>({...p,descanso_s:parseInt(e.target.value)}))}/></div>
                        <div className="form-group" style={{margin:0,gridColumn:'2/-1'}}><label>Notas</label><input value={ejForm.notas} onChange={e=>setEjForm(p=>({...p,notas:e.target.value}))} placeholder="Codos adentro, agarre prono..."/></div>
                      </div>
                      <div style={{display:'flex',gap:8}}>
                        <button type="submit" className="btn btn-primary" disabled={saving} style={{fontSize:13,padding:'7px 14px'}}>Agregar</button>
                        <button type="button" className="btn btn-ghost" style={{fontSize:13,padding:'7px 12px'}} onClick={()=>{setShowEjForm(false);setActiveRutina(null)}}>Cancelar</button>
                      </div>
                    </form>
                  )}

                  {(!r.ejercicios || r.ejercicios.length === 0)
                    ? <div style={{fontSize:13,color:'#444',padding:'10px 0',textAlign:'center'}}>Sin ejercicios aún</div>
                    : r.ejercicios.sort((a: any,b: any)=>a.orden-b.orden).map((ej: any,i: number) => (
                      <div key={ej.id} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 10px',background:'rgba(255,255,255,0.03)',borderRadius:7,marginBottom:5}}>
                        <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:18,color:'#c8f542',width:22,textAlign:'center'}}>{i+1}</div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:13,fontWeight:500}}>{ej.nombre}</div>
                          <div style={{fontSize:11,color:'#666',marginTop:1}}>{ej.series} series{ej.reps?` · ${ej.reps}`:''}{ej.notas?` · ${ej.notas}`:''}</div>
                        </div>
                        <span style={{fontSize:10,padding:'2px 7px',borderRadius:20,background:ej.tipo==='al_fallo'?'rgba(248,113,113,0.1)':ej.tipo==='series'?'rgba(74,222,128,0.1)':'rgba(96,165,250,0.1)',color:ej.tipo==='al_fallo'?'#f87171':ej.tipo==='series'?'#4ade80':'#60a5fa'}}>
                          {TIPOS.find(t=>t.value===ej.tipo)?.label}
                        </span>
                        <button onClick={()=>handleDeleteEj(r.id,ej.id)} style={{background:'none',border:'none',color:'#555',cursor:'pointer',fontSize:15,padding:'2px 5px'}}
                          onMouseEnter={e=>(e.currentTarget.style.color='#f87171')} onMouseLeave={e=>(e.currentTarget.style.color='#555')}>×</button>
                      </div>
                    ))
                  }
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
