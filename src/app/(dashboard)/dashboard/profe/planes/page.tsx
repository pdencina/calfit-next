import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fmtCLP } from '@/lib/supabase/api'

const PLANES = [
  { id:'starter', nombre:'STARTER', precio_mes:18000, precio_anual:145000, max_alumnos:10, color:'#888',
    features:['Hasta 10 alumnos','Rutinas ilimitadas','Mensajería','Dashboard financiero','Cobros con Mercado Pago'],
    sin:['Métricas avanzadas','Nutrición'] },
  { id:'pro', nombre:'PRO', precio_mes:37000, precio_anual:295000, max_alumnos:50, color:'#c8f542', badge:'MÁS POPULAR',
    features:['Hasta 50 alumnos','Todo Starter','Métricas corporales','Videos en ejercicios','Planes de nutrición','Soporte prioritario'],
    sin:[] },
  { id:'elite', nombre:'ELITE', precio_mes:65000, precio_anual:520000, max_alumnos:999, color:'#fbbf24',
    features:['Alumnos ilimitados','Todo Pro','White label','API access','Manager de equipo','Onboarding 1:1'],
    sin:[] },
]

export default async function PlanesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: org } = await supabase.from('organizations').select('*, plans(*)').eq('owner_id', user.id).single()
  const currentPlan = org?.plan_id || 'starter'
  const isTrial     = org?.plan_status === 'trialing'
  const trialDays   = org?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(org.trial_ends_at).getTime() - Date.now()) / 86400000))
    : 0

  return (
    <div>
      <div className="page-title">MI PLAN</div>
      <div className="page-sub">Elegí el plan que se adapta a tu negocio</div>

      {isTrial && (
        <div style={{background:'rgba(251,191,36,0.08)',border:'1px solid rgba(251,191,36,0.2)',borderRadius:12,padding:'14px 20px',marginBottom:24,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
          <div>
            <div style={{fontSize:14,fontWeight:500,color:'#fbbf24'}}>⏳ Trial activo — {trialDays} días restantes</div>
            <div style={{fontSize:12,color:'#888',marginTop:2}}>Al terminar el trial, elegí un plan para seguir usando CALFIT PRO</div>
          </div>
        </div>
      )}

      <p style={{fontSize:13,color:'#666',marginBottom:28,textAlign:'center'}}>Precios en CLP · Sin IVA · Cancelá cuando quieras</p>

      <div className="grid-3">
        {PLANES.map(plan => {
          const isCurrent = currentPlan === plan.id
          return (
            <div key={plan.id} className="card" style={{
              borderColor:isCurrent?plan.color:'rgba(255,255,255,0.07)',
              background:isCurrent?`rgba(200,245,66,0.02)`:'var(--surface2)',
              display:'flex',flexDirection:'column',position:'relative',
            }}>
              {plan.badge && (
                <div style={{position:'absolute',top:-12,left:'50%',transform:'translateX(-50%)',background:'#c8f542',color:'#070707',fontSize:10,fontWeight:700,letterSpacing:1.5,padding:'4px 14px',borderRadius:20}}>
                  {plan.badge}
                </div>
              )}
              <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:24,letterSpacing:3,color:plan.color,marginBottom:4}}>{plan.nombre}</div>
              <div style={{fontSize:12,color:'#555',marginBottom:16}}>{plan.max_alumnos >= 999 ? 'Alumnos ilimitados' : `Hasta ${plan.max_alumnos} alumnos`}</div>
              <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:40,lineHeight:1,marginBottom:4}}>{fmtCLP(plan.precio_mes)}</div>
              <div style={{fontSize:12,color:'#666',marginBottom:20}}>/mes · CLP</div>
              <div style={{height:1,background:'rgba(255,255,255,0.07)',marginBottom:16}}/>
              <div style={{flex:1,marginBottom:20}}>
                {plan.features.map((f,i) => (
                  <div key={i} style={{display:'flex',gap:8,marginBottom:8,fontSize:13}}>
                    <span style={{color:'#c8f542',flexShrink:0}}>✓</span><span>{f}</span>
                  </div>
                ))}
                {plan.sin.map((f,i) => (
                  <div key={i} style={{display:'flex',gap:8,marginBottom:8,fontSize:13,opacity:0.3}}>
                    <span style={{flexShrink:0}}>—</span><span>{f}</span>
                  </div>
                ))}
              </div>
              {isCurrent ? (
                <div style={{padding:'12px',textAlign:'center',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,color:'#666',fontSize:13}}>
                  Plan actual {isTrial ? '(trial)' : '✓'}
                </div>
              ) : (
                <a href={`https://wa.me/56949616038?text=Hola%2C+quiero+contratar+el+plan+${plan.nombre}+de+CALFIT+PRO`}
                  target="_blank"
                  style={{display:'block',padding:'12px',textAlign:'center',background:plan.id==='pro'?'#c8f542':'transparent',color:plan.id==='pro'?'#070707':'#f0efe8',borderRadius:8,border:plan.id==='pro'?'none':'1px solid rgba(255,255,255,0.15)',fontFamily:'"Bebas Neue",sans-serif',fontSize:16,letterSpacing:2,textDecoration:'none',transition:'opacity 0.2s'}}>
                  CONTRATAR →
                </a>
              )}
            </div>
          )
        })}
      </div>

      <div style={{marginTop:28,textAlign:'center'}}>
        <a href="https://wa.me/56949616038?text=Hola%2C+quiero+consultar+sobre+CALFIT+PRO" target="_blank"
          style={{display:'inline-flex',alignItems:'center',gap:8,background:'#25D366',color:'#fff',padding:'12px 28px',borderRadius:8,fontSize:14,fontWeight:500,textDecoration:'none'}}>
          💬 Hablar con soporte por WhatsApp
        </a>
      </div>
    </div>
  )
}
