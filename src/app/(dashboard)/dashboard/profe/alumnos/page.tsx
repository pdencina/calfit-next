'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAlumnos, getMetricasAlumno, getSesionesAlumno, invitarAlumno } from '@/lib/supabase/api'

function InviteModal({ orgId, onClose, onDone }: any) {
  const [nombre, setNombre] = useState('')
  const [email, setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [ok, setOk]         = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const sb   = createClient()
      const data = await invitarAlumno(sb, orgId, email, nombre)
      setOk(data.message)
      onDone()
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div className="card" style={{ width:'100%',maxWidth:440 }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
          <div style={{ fontFamily:'"Bebas Neue",sans-serif',fontSize:22,letterSpacing:2 }}>INVITAR ALUMNO</div>
          <button onClick={onClose} style={{ background:'none',border:'none',color:'#666',fontSize:20,cursor:'pointer' }}>✕</button>
        </div>
        {ok ? (
          <div style={{ textAlign:'center',padding:'20px 0' }}>
            <div style={{ fontSize:48,marginBottom:12 }}>🎉</div>
            <div style={{ fontFamily:'"Bebas Neue",sans-serif',fontSize:20,color:'#c8f542',marginBottom:8 }}>INVITACIÓN ENVIADA</div>
            <p style={{ fontSize:13,color:'#888',lineHeight:1.6,marginBottom:20 }}>{ok}</p>
            <div style={{ display:'flex',gap:8,justifyContent:'center' }}>
              <button className="btn btn-primary" onClick={() => { setOk(''); setNombre(''); setEmail('') }}>Invitar otro</button>
              <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label>Nombre del alumno</label><input value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Carlos García" required autoFocus/></div>
            <div className="form-group"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="carlos@email.com" required/></div>
            {error && <div className="alert alert-error">{error}</div>}
            <div style={{ background:'rgba(200,245,66,0.05)',border:'1px solid rgba(200,245,66,0.15)',borderRadius:8,padding:'12px 14px',marginBottom:16 }}>
              {['Cuenta creada automáticamente','Email con credenciales enviado','Alumno en tu org al instante'].map((t,i) => (
                <div key={i} style={{ fontSize:12,color:'#888',display:'flex',gap:6,marginBottom:4 }}><span style={{ color:'#c8f542' }}>✓</span>{t}</div>
              ))}
            </div>
            <div style={{ display:'flex',gap:8 }}>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex:1 }}>{loading ? 'Enviando...' : '📧 INVITAR'}</button>
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default function AlumnosPage() {
  const [org, setOrg]           = useState<any>(null)
  const [alumnos, setAlumnos]   = useState<any[]>([])
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [alumnoData, setAlumnoData] = useState<any>({})

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: orgData } = await sb.from('organizations').select('*, plans(*)').eq('owner_id', user.id).single()
      setOrg(orgData)
      if (orgData) load(sb, orgData.id)
    })
  }, [])

  const load = useCallback(async (sb: any, orgId: number) => {
    setLoading(true)
    const data = await getAlumnos(sb, orgId).catch(() => [])
    setAlumnos(data)
    const entries = await Promise.all(data.map(async (a: any) => {
      const [metrics, sesiones] = await Promise.all([
        getMetricasAlumno(sb, a.id, 8).catch(() => []),
        getSesionesAlumno(sb, a.id, 20).catch(() => []),
      ])
      return [a.id, { metrics: [...metrics].reverse(), sesiones }]
    }))
    setAlumnoData(Object.fromEntries(entries))
    setLoading(false)
  }, [])

  const filtered = alumnos.filter(a =>
    a.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase())
  )
  const maxAlumnos = org?.plans?.max_alumnos || 10

  return (
    <div>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12,marginBottom:24 }}>
        <div>
          <div className="page-title">MIS ALUMNOS</div>
          <div className="page-sub">{alumnos.length} de {maxAlumnos} alumnos</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowInvite(true)} disabled={alumnos.length >= maxAlumnos}>
          {alumnos.length >= maxAlumnos ? 'LÍMITE ALCANZADO' : '+ INVITAR ALUMNO'}
        </button>
      </div>

      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar alumno..." style={{ maxWidth:320,marginBottom:20,display:'block',background:'#1e1e1e',border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,padding:'10px 14px',color:'#f0efe8',fontSize:14,width:'100%',outline:'none' }}/>

      {loading && <div className="loader"><div className="spinner"/>Cargando...</div>}
      {!loading && filtered.length === 0 && (
        <div className="empty">
          <div className="empty-icon">👥</div>
          <div className="empty-title">SIN ALUMNOS</div>
          <div className="empty-sub">{search ? 'Sin resultados' : 'Invitá tu primer alumno para empezar'}</div>
        </div>
      )}

      <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
        {filtered.map((a: any) => {
          const d       = alumnoData[a.id] || {}
          const ses     = d.sesiones || []
          const sesComp = ses.filter((s: any) => s.completada).length
          const tasa    = ses.length ? Math.round(sesComp/ses.length*100) : 0
          const init    = a.full_name?.split(' ').map((w: string)=>w[0]).join('').slice(0,2).toUpperCase() || '??'
          const diasSin = ses[0] ? Math.floor((Date.now()-new Date(ses[0].fecha).getTime())/86400000) : null
          const ultimaMet = d.metrics?.[d.metrics.length-1]
          return (
            <div key={a.id} className="card" style={{ display:'grid',gridTemplateColumns:'auto 1fr auto',gap:16,alignItems:'center' }}>
              <div style={{ width:44,height:44,borderRadius:'50%',background:'#c8f542',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:'#070707',flexShrink:0 }}>{init}</div>
              <div>
                <div style={{ fontSize:15,fontWeight:600 }}>{a.full_name}</div>
                <div style={{ fontSize:12,color:'#666',marginTop:2 }}>{a.email}</div>
                <div style={{ display:'flex',gap:8,marginTop:6,flexWrap:'wrap' }}>
                  {ultimaMet?.peso_kg && <span className="badge badge-lime">⚖️ {ultimaMet.peso_kg} kg</span>}
                  {diasSin !== null && <span className={diasSin > 7 ? 'badge badge-danger' : 'badge badge-success'}>{diasSin === 0 ? '✓ Hoy' : diasSin + 'd sin entrenar'}</span>}
                  {ses.length === 0 && <span className="badge badge-warning">Sin sesiones aún</span>}
                </div>
              </div>
              <div style={{ display:'flex',gap:16,alignItems:'center' }}>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontFamily:'"Bebas Neue",sans-serif',fontSize:26,color:'#c8f542',lineHeight:1 }}>{sesComp}</div>
                  <div style={{ fontSize:10,color:'#555',textTransform:'uppercase',letterSpacing:1 }}>sesiones</div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontFamily:'"Bebas Neue",sans-serif',fontSize:26,color:tasa>=70?'#4ade80':tasa>=40?'#fbbf24':'#f87171',lineHeight:1 }}>{tasa}%</div>
                  <div style={{ fontSize:10,color:'#555',textTransform:'uppercase',letterSpacing:1 }}>tasa</div>
                </div>
                <a href={'/dashboard/profe/rutinas?alumno=' + a.id} className="btn btn-ghost" style={{ fontSize:12,padding:'6px 12px' }}>📋 Rutinas</a>
              </div>
            </div>
          )
        })}
      </div>

      {showInvite && org && <InviteModal orgId={org.id} onClose={() => setShowInvite(false)} onDone={() => { setShowInvite(false); const sb = createClient(); if(org) load(sb, org.id) }}/>}
    </div>
  )
}
