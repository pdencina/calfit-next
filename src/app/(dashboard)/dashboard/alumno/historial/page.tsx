import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getSesionesAlumno } from '@/lib/supabase/api'

export default async function HistorialPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sesiones = await getSesionesAlumno(supabase, user.id, 50)

  const completadas = sesiones?.filter((s: any) => s.completada).length || 0
  const duracionTotal = sesiones?.reduce((acc: number, s: any) => acc + (s.duracion_min || 0), 0) || 0

  return (
    <div>
      <div className="page-title">HISTORIAL</div>
      <div className="page-sub">Todas tus sesiones de entrenamiento</div>

      <div className="grid-3" style={{marginBottom:24}}>
        <div className="card">
          <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:36,color:'#c8f542',lineHeight:1}}>{sesiones?.length||0}</div>
          <div style={{fontSize:11,textTransform:'uppercase',letterSpacing:1.5,color:'#666',marginTop:6}}>Total sesiones</div>
        </div>
        <div className="card">
          <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:36,color:'#4ade80',lineHeight:1}}>{completadas}</div>
          <div style={{fontSize:11,textTransform:'uppercase',letterSpacing:1.5,color:'#666',marginTop:6}}>Completadas</div>
        </div>
        <div className="card">
          <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:36,color:'#60a5fa',lineHeight:1}}>{duracionTotal}</div>
          <div style={{fontSize:11,textTransform:'uppercase',letterSpacing:1.5,color:'#666',marginTop:6}}>Minutos totales</div>
        </div>
      </div>

      <div className="card" style={{padding:0,overflow:'hidden'}}>
        {!sesiones?.length ? (
          <div style={{textAlign:'center',padding:'48px',color:'#444',fontSize:13}}>Sin sesiones registradas aún</div>
        ) : sesiones.map((s: any, i: number) => (
          <div key={s.id} style={{display:'flex',alignItems:'center',gap:14,padding:'13px 18px',borderBottom:i<sesiones.length-1?'1px solid rgba(255,255,255,0.05)':'none'}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:s.completada?'#4ade80':'#555',flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:500}}>{s.rutinas?.nombre || 'Sesión libre'}</div>
              <div style={{fontSize:11,color:'#666',marginTop:2}}>{s.rutinas?.categoria}</div>
            </div>
            {s.duracion_min && (
              <div style={{fontSize:12,color:'#666'}}>{s.duracion_min} min</div>
            )}
            <div style={{fontSize:12,color:'#555'}}>{new Date(s.fecha||s.created_at).toLocaleDateString('es-CL',{weekday:'short',day:'numeric',month:'short'})}</div>
            <span style={{fontSize:11,padding:'3px 10px',borderRadius:20,
              background:s.completada?'rgba(74,222,128,0.1)':'rgba(251,191,36,0.1)',
              color:s.completada?'#4ade80':'#fbbf24'}}>
              {s.completada?'Completada':'Incompleta'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
