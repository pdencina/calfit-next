'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMetricasAlumno, insertMetrica } from '@/lib/supabase/api'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function MetricasAlumno() {
  const [userId, setUserId]   = useState('')
  const [metricas, setMetricas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]       = useState({ peso_kg:'', grasa_pct:'', musculo_pct:'', cintura_cm:'', notas:'' })
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState('')

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      const data = await getMetricasAlumno(sb, user.id, 20)
      setMetricas([...( data||[])].reverse())
      setLoading(false)
    })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const sb = createClient()
      const payload: any = { user_id: userId, fecha: new Date().toISOString().split('T')[0] }
      if (form.peso_kg)   payload.peso_kg    = parseFloat(form.peso_kg)
      if (form.grasa_pct) payload.grasa_pct  = parseFloat(form.grasa_pct)
      if (form.musculo_pct) payload.musculo_pct = parseFloat(form.musculo_pct)
      if (form.cintura_cm) payload.cintura_cm = parseFloat(form.cintura_cm)
      if (form.notas)     payload.notas      = form.notas
      await insertMetrica(sb, payload)
      const data = await getMetricasAlumno(sb, userId, 20)
      setMetricas([...(data||[])].reverse())
      setForm({ peso_kg:'', grasa_pct:'', musculo_pct:'', cintura_cm:'', notas:'' })
      setShowForm(false)
      setMsg('✓ Métricas guardadas')
      setTimeout(() => setMsg(''), 3000)
    } catch (err: any) { setMsg('Error: ' + err.message) }
    finally { setSaving(false) }
  }

  const ultima = metricas[metricas.length - 1]
  const anterior = metricas[metricas.length - 2]

  const diff = (campo: string) => {
    if (!ultima || !anterior) return null
    const d = Number(ultima[campo]) - Number(anterior[campo])
    if (isNaN(d) || d === 0) return null
    return { value: d.toFixed(1), up: d > 0 }
  }

  if (loading) return <div className="loader"><div className="spinner"/>Cargando...</div>

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24}}>
        <div>
          <div className="page-title">MIS MÉTRICAS</div>
          <div className="page-sub">Seguimiento de tu progreso corporal</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>+ Registrar hoy</button>
      </div>

      {msg && <div className="alert alert-success" style={{marginBottom:16}}>{msg}</div>}

      {showForm && (
        <form onSubmit={handleSave} className="card" style={{marginBottom:20}}>
          <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:18,letterSpacing:2,marginBottom:14}}>NUEVA MEDICIÓN</div>
          <div className="grid-4" style={{marginBottom:12}}>
            {[['peso_kg','Peso (kg)','75.5'],['grasa_pct','% Grasa','18.5'],['musculo_pct','% Músculo','42'],['cintura_cm','Cintura (cm)','82']].map(([k,l,p]) => (
              <div key={k} className="form-group" style={{margin:0}}>
                <label>{l}</label>
                <input type="number" step="0.1" value={(form as any)[k]} onChange={e=>setForm(prev=>({...prev,[k]:e.target.value}))} placeholder={p}/>
              </div>
            ))}
          </div>
          <div className="form-group"><label>Notas</label><input value={form.notas} onChange={e=>setForm(p=>({...p,notas:e.target.value}))} placeholder="Cómo me sentí hoy..."/></div>
          <div style={{display:'flex',gap:8}}>
            <button type="submit" className="btn btn-primary" disabled={saving}>Guardar</button>
            <button type="button" className="btn btn-ghost" onClick={()=>setShowForm(false)}>Cancelar</button>
          </div>
        </form>
      )}

      {metricas.length === 0 ? (
        <div className="card" style={{textAlign:'center',padding:'48px'}}>
          <div style={{fontSize:40,marginBottom:12,opacity:0.2}}>📊</div>
          <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:20,color:'#444',marginBottom:8}}>SIN REGISTROS</div>
          <div style={{fontSize:13,color:'#555'}}>Registrá tu primera medición para ver tu progreso</div>
        </div>
      ) : (
        <>
          {/* Última medición */}
          {ultima && (
            <div className="grid-4" style={{marginBottom:20}}>
              {[
                { label:'Peso',    val:ultima.peso_kg,    unit:'kg', campo:'peso_kg',    positive:false },
                { label:'% Grasa', val:ultima.grasa_pct,  unit:'%',  campo:'grasa_pct',  positive:false },
                { label:'% Músculo',val:ultima.musculo_pct,unit:'%', campo:'musculo_pct', positive:true  },
                { label:'Cintura', val:ultima.cintura_cm, unit:'cm', campo:'cintura_cm', positive:false },
              ].map(m => {
                const d = diff(m.campo)
                const mejora = d ? (m.positive ? d.up : !d.up) : null
                return (
                  <div key={m.label} className="card">
                    <div style={{fontSize:11,textTransform:'uppercase',letterSpacing:1.5,color:'#666',marginBottom:6}}>{m.label}</div>
                    <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:36,color:'#c8f542',lineHeight:1}}>
                      {m.val ? `${m.val}${m.unit}` : '—'}
                    </div>
                    {d && (
                      <div style={{fontSize:12,marginTop:4,color:mejora?'#4ade80':'#f87171'}}>
                        {d.up?'↑':'↓'} {Math.abs(Number(d.value))}{m.unit}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Gráfico peso */}
          {metricas.some((m: any) => m.peso_kg) && (
            <div className="card" style={{marginBottom:16}}>
              <div style={{fontSize:12,letterSpacing:1.5,textTransform:'uppercase',color:'#666',marginBottom:16}}>Evolución de peso</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={metricas.filter((m: any) => m.peso_kg)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                  <XAxis dataKey="fecha" tick={{fill:'#555',fontSize:11}} tickFormatter={(v:string)=>v?.slice(5)}/>
                  <YAxis tick={{fill:'#555',fontSize:11}} domain={['auto','auto']}/>
                  <Tooltip contentStyle={{background:'#1e1e1e',border:'1px solid #333',borderRadius:8,fontSize:12}}/>
                  <Line type="monotone" dataKey="peso_kg" stroke="#c8f542" strokeWidth={2} dot={{fill:'#c8f542',r:4}} name="Peso (kg)"/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Historial tabla */}
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <div style={{padding:'12px 16px',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr',gap:8,fontSize:10,letterSpacing:1.5,textTransform:'uppercase',color:'#666'}}>
              <span>Fecha</span><span>Peso</span><span>Grasa</span><span>Músculo</span><span>Cintura</span>
            </div>
            {[...metricas].reverse().map((m: any) => (
              <div key={m.id} style={{padding:'11px 16px',borderBottom:'1px solid rgba(255,255,255,0.04)',display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr',gap:8,fontSize:13}}>
                <span style={{color:'#666'}}>{new Date(m.fecha).toLocaleDateString('es-CL',{day:'numeric',month:'short'})}</span>
                <span>{m.peso_kg ? `${m.peso_kg} kg` : '—'}</span>
                <span>{m.grasa_pct ? `${m.grasa_pct}%` : '—'}</span>
                <span>{m.musculo_pct ? `${m.musculo_pct}%` : '—'}</span>
                <span>{m.cintura_cm ? `${m.cintura_cm} cm` : '—'}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
