'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getRutinasAlumno, createSesion, completarSesion, getEstadisticasAlumno } from '@/lib/supabase/api'

function Timer({ sesionId, orgId, onComplete }: any) {
  const [secs, setSecs]         = useState(0)
  const [restando, setRestando] = useState(0)
  const [ejActual, setEjActual] = useState(0)
  const intervalRef = useRef<any>(null)
  const restoRef    = useRef<any>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => setSecs(s => s + 1), 1000)
    return () => clearInterval(intervalRef.current)
  }, [])

  const fmt = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`

  function iniciarDescanso(segundos: number) {
    clearInterval(restoRef.current)
    setRestando(segundos)
    restoRef.current = setInterval(() => {
      setRestando(p => {
        if (p <= 1) { clearInterval(restoRef.current); return 0 }
        return p - 1
      })
    }, 1000)
  }

  async function handleComplete() {
    clearInterval(intervalRef.current)
    if (!confirm(`¿Completar sesión? Duración: ${fmt(secs)}`)) return
    const sb = createClient()
    await completarSesion(sb, sesionId, { duracion_min: Math.round(secs/60) })
    onComplete()
  }

  return (
    <div style={{position:'fixed',bottom:24,right:24,background:'#111',border:'1px solid rgba(200,245,66,0.3)',borderRadius:14,padding:'18px 22px',zIndex:200,boxShadow:'0 8px 32px rgba(0,0,0,0.6)',minWidth:220}}>
      <div style={{fontSize:11,letterSpacing:2,textTransform:'uppercase',color:'#666',marginBottom:4}}>Sesión activa</div>
      <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:48,color:'#c8f542',lineHeight:1,letterSpacing:2}}>{fmt(secs)}</div>
      {restando > 0 && (
        <div style={{fontSize:13,color:'#fbbf24',marginTop:4}}>⏳ Descanso: {fmt(restando)}</div>
      )}
      <button onClick={handleComplete} className="btn btn-primary" style={{width:'100%',marginTop:12,fontSize:15,letterSpacing:2}}>
        ✓ COMPLETAR
      </button>
    </div>
  )
}

export default function AlumnoInicio() {
  const [user, setUser]         = useState<any>(null)
  const [rutinas, setRutinas]   = useState<any[]>([])
  const [stats, setStats]       = useState<any>({})
  const [loading, setLoading]   = useState(true)
  const [sesionActiva, setSesionActiva] = useState<any>(null)
  const [orgId, setOrgId]       = useState<number|null>(null)

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) return
      setUser(u)
      // Obtener org del alumno
      const { data: mem } = await sb.from('memberships').select('org_id').eq('user_id', u.id).eq('role','alumno').eq('status','active').single()
      if (mem) setOrgId(mem.org_id)
      const [r, s] = await Promise.all([
        getRutinasAlumno(sb, u.id),
        getEstadisticasAlumno(sb, u.id),
      ])
      setRutinas(r || [])
      setStats(s || {})
      setLoading(false)
    })
  }, [])

  async function iniciarSesion(rutina: any) {
    if (!orgId || !user) return
    const sb  = createClient()
    const ses = await createSesion(sb, orgId, user.id, rutina.id)
    setSesionActiva({ ...ses, rutina })
  }

  function onSesionComplete() {
    setSesionActiva(null)
    // Refresh stats
    const sb = createClient()
    getEstadisticasAlumno(sb, user.id).then(setStats)
  }

  if (loading) return <div className="loader"><div className="spinner"/>Cargando...</div>

  return (
    <div>
      <div className="page-title">MIS RUTINAS</div>
      <div className="page-sub">Elegí tu rutina de hoy y empezá a entrenar</div>

      {/* Stats */}
      <div className="grid-4" style={{marginBottom:24}}>
        {[
          { label:'Sesiones totales', value:stats.total||0,       color:'#c8f542' },
          { label:'Completadas',      value:stats.completadas||0,  color:'#4ade80' },
          { label:'Consistencia',     value:`${stats.porcentaje||0}%`, color:'#60a5fa' },
          { label:'Minutos totales',  value:stats.duracion||0,     color:'#fbbf24' },
        ].map((s,i) => (
          <div key={i} className="card">
            <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:36,color:s.color,lineHeight:1}}>{s.value}</div>
            <div style={{fontSize:11,textTransform:'uppercase',letterSpacing:1.5,color:'#666',marginTop:6}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Rutinas */}
      {rutinas.length === 0 ? (
        <div className="card" style={{textAlign:'center',padding:'48px'}}>
          <div style={{fontSize:44,marginBottom:12,opacity:0.2}}>💪</div>
          <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:22,color:'#444',marginBottom:8}}>SIN RUTINAS AÚN</div>
          <div style={{fontSize:13,color:'#555'}}>Tu profe aún no asignó rutinas. ¡Ya vienen!</div>
        </div>
      ) : rutinas.map((r: any) => (
        <div key={r.id} className="card" style={{marginBottom:16}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
            <div>
              <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:22,letterSpacing:2,color:'#c8f542'}}>{r.nombre}</div>
              {r.descripcion && <div style={{fontSize:12,color:'#666',marginTop:2}}>{r.descripcion}</div>}
              <div style={{fontSize:12,color:'#555',marginTop:4}}>{r.ejercicios?.length||0} ejercicios</div>
            </div>
            {sesionActiva?.rutina.id === r.id ? (
              <span style={{padding:'8px 16px',background:'rgba(200,245,66,0.1)',border:'1px solid rgba(200,245,66,0.3)',borderRadius:8,color:'#c8f542',fontSize:13}}>▶ En curso</span>
            ) : (
              <button onClick={() => iniciarSesion(r)} disabled={!!sesionActiva}
                style={{background:sesionActiva?'#333':'#c8f542',color:sesionActiva?'#666':'#070707',padding:'10px 20px',borderRadius:8,fontFamily:'"Bebas Neue",sans-serif',fontSize:15,letterSpacing:2,border:'none',cursor:sesionActiva?'not-allowed':'pointer'}}>
                ▶ INICIAR
              </button>
            )}
          </div>

          {r.ejercicios?.sort((a: any,b: any)=>a.orden-b.orden).map((ej: any,i: number) => {
            const isCurrent = sesionActiva?.rutina.id === r.id
            return (
              <div key={ej.id} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',background:'rgba(255,255,255,0.03)',borderRadius:8,marginBottom:5}}>
                <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:18,color:'#c8f542',width:22,textAlign:'center'}}>{i+1}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:500}}>{ej.nombre}</div>
                  <div style={{fontSize:11,color:'#666',marginTop:1}}>{ej.series} series{ej.reps?` · ${ej.reps}`:''}</div>
                </div>
                {isCurrent && ej.descanso_s > 0 && (
                  <button onClick={() => {}}
                    style={{fontSize:11,padding:'3px 8px',background:'rgba(251,191,36,0.1)',color:'#fbbf24',border:'none',borderRadius:6,cursor:'pointer'}}>
                    ⏱ {ej.descanso_s}s
                  </button>
                )}
                <span style={{fontSize:10,padding:'2px 7px',borderRadius:20,
                  background:ej.tipo==='al_fallo'?'rgba(248,113,113,0.1)':'rgba(74,222,128,0.1)',
                  color:ej.tipo==='al_fallo'?'#f87171':'#4ade80'}}>
                  {ej.tipo==='al_fallo'?'Al fallo':ej.tipo==='tiempo'?'Por tiempo':'Por series'}
                </span>
              </div>
            )
          })}
        </div>
      ))}

      {sesionActiva && <Timer sesionId={sesionActiva.id} orgId={orgId} onComplete={onSesionComplete}/>}
    </div>
  )
}
