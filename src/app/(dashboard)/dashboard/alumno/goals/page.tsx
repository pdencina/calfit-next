'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function GoalsPage() {
  const [goals, setGoals] = useState<any[]>([])
  const [form, setForm]   = useState({ titulo:'', descripcion:'', fecha_limite:'' })
  const [show, setShow]   = useState(false)
  const [userId, setUserId] = useState('')

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      const { data } = await sb.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      setGoals(data || [])
    })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const sb = createClient()
    const { data } = await sb.from('goals').insert({ user_id: userId, ...form }).select().single()
    if (data) setGoals(prev => [data, ...prev])
    setForm({ titulo:'', descripcion:'', fecha_limite:'' })
    setShow(false)
  }

  async function toggleGoal(goal: any) {
    const sb = createClient()
    await sb.from('goals').update({ completado: !goal.completado }).eq('id', goal.id)
    setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, completado: !g.completado } : g))
  }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24}}>
        <div><div className="page-title">OBJETIVOS</div><div className="page-sub">Tus metas de entrenamiento</div></div>
        <button className="btn btn-primary" onClick={() => setShow(!show)}>+ Nuevo objetivo</button>
      </div>

      {show && (
        <form onSubmit={handleSave} className="card" style={{marginBottom:16}}>
          <div className="form-group"><label>Objetivo</label><input value={form.titulo} onChange={e=>setForm(p=>({...p,titulo:e.target.value}))} placeholder="Ej: 10 muscle-ups seguidos" required autoFocus/></div>
          <div className="form-group"><label>Descripción</label><input value={form.descripcion} onChange={e=>setForm(p=>({...p,descripcion:e.target.value}))} placeholder="Detalles del objetivo..."/></div>
          <div className="form-group"><label>Fecha límite</label><input type="date" value={form.fecha_limite} onChange={e=>setForm(p=>({...p,fecha_limite:e.target.value}))}/></div>
          <div style={{display:'flex',gap:8}}>
            <button type="submit" className="btn btn-primary">Guardar</button>
            <button type="button" className="btn btn-ghost" onClick={()=>setShow(false)}>Cancelar</button>
          </div>
        </form>
      )}

      {goals.length === 0 && !show && (
        <div className="card" style={{textAlign:'center',padding:'48px'}}>
          <div style={{fontSize:40,marginBottom:12,opacity:0.2}}>🎯</div>
          <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:20,color:'#444',marginBottom:8}}>SIN OBJETIVOS</div>
          <div style={{fontSize:13,color:'#555'}}>Definí tus metas para mantener el foco</div>
        </div>
      )}

      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {goals.map((g: any) => (
          <div key={g.id} className="card" style={{display:'flex',alignItems:'center',gap:14,opacity:g.completado?0.5:1}}>
            <button onClick={()=>toggleGoal(g)}
              style={{width:24,height:24,borderRadius:'50%',border:`2px solid ${g.completado?'#4ade80':'rgba(255,255,255,0.2)'}`,background:g.completado?'#4ade80':'transparent',cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',color:'#070707',fontSize:14}}>
              {g.completado?'✓':''}
            </button>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:500,textDecoration:g.completado?'line-through':'none'}}>{g.titulo}</div>
              {g.descripcion && <div style={{fontSize:12,color:'#666',marginTop:2}}>{g.descripcion}</div>}
              {g.fecha_limite && <div style={{fontSize:11,color:'#555',marginTop:2}}>📅 {new Date(g.fecha_limite).toLocaleDateString('es-CL',{day:'numeric',month:'long',year:'numeric'})}</div>}
            </div>
            {g.completado && <span className="badge badge-success">✓ Logrado</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
