import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPlatformKPIs, getOrgsOverview } from '@/lib/supabase/api'
import { fmtCLP } from '@/lib/supabase/api'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  let kpis: any = {}
  let orgs: any[] = []
  try {
    kpis = await getPlatformKPIs(supabase)
    orgs = await getOrgsOverview(supabase) || []
  } catch {}

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
        <div className="page-title" style={{marginBottom:0}}>PLATAFORMA</div>
        <span style={{fontSize:11,padding:'3px 10px',borderRadius:20,background:'rgba(251,191,36,0.1)',color:'#fbbf24',letterSpacing:1,fontWeight:600}}>ADMIN</span>
      </div>
      <div className="page-sub">Vista global de CALFIT PRO</div>

      <div className="grid-4" style={{marginBottom:24}}>
        {[
          { label:'MRR Plataforma',  value:fmtCLP(kpis?.mrr_plataforma_clp||0), color:'#c8f542', icon:'💰' },
          { label:'Profes activos',  value:kpis?.orgs_activas||0, color:'#60a5fa', icon:'👨‍🏫' },
          { label:'En trial',        value:kpis?.orgs_trial||0,   color:'#fbbf24', icon:'⏳' },
          { label:'Alumnos totales', value:kpis?.total_alumnos||0, color:'#4ade80', icon:'🏋️' },
        ].map((k,i) => (
          <div key={i} className="card">
            <div style={{fontSize:22,marginBottom:8,opacity:0.4}}>{k.icon}</div>
            <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:i===0?24:36,color:k.color,lineHeight:1}}>{k.value}</div>
            <div style={{fontSize:11,textTransform:'uppercase',letterSpacing:1.5,color:'#666',marginTop:6}}>{k.label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div style={{padding:'12px 16px',borderBottom:'1px solid rgba(255,255,255,0.06)',fontSize:12,letterSpacing:1.5,textTransform:'uppercase',color:'#666'}}>Organizaciones recientes</div>
        {orgs.slice(0,10).map((o: any, i: number) => (
          <div key={o.org_id} style={{display:'grid',gridTemplateColumns:'1fr auto auto auto',gap:16,padding:'12px 16px',alignItems:'center',borderBottom:i<Math.min(orgs.length,10)-1?'1px solid rgba(255,255,255,0.04)':'none'}}>
            <div>
              <div style={{fontSize:13,fontWeight:500}}>{o.owner_name}</div>
              <div style={{fontSize:11,color:'#666'}}>{o.owner_email}</div>
            </div>
            <span style={{fontSize:11,padding:'2px 8px',borderRadius:20,background:'rgba(200,245,66,0.1)',color:'#c8f542'}}>{o.plan_id?.toUpperCase()}</span>
            <div style={{textAlign:'center'}}>
              <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:22,color:'#c8f542'}}>{o.total_alumnos||0}</div>
              <div style={{fontSize:10,color:'#555'}}>alumnos</div>
            </div>
            <span style={{fontSize:11,padding:'2px 8px',borderRadius:20,
              background:o.plan_status==='active'?'rgba(74,222,128,0.1)':o.plan_status==='trialing'?'rgba(96,165,250,0.1)':'rgba(248,113,113,0.1)',
              color:o.plan_status==='active'?'#4ade80':o.plan_status==='trialing'?'#60a5fa':'#f87171'}}>
              {o.plan_status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
