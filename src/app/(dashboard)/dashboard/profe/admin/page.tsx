'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getKPIsAdmin, getCuotas, marcarPagada, fmtCLP } from '@/lib/supabase/api'

export default function AdminPage() {
  const [org, setOrg]         = useState<any>(null)
  const [kpis, setKpis]       = useState<any>({})
  const [cuotas, setCuotas]   = useState<any[]>([])
  const [filtro, setFiltro]   = useState('pendiente')
  const [loading, setLoading] = useState(true)
  const [msg, setMsg]         = useState('')

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: o } = await sb.from('organizations').select('*').eq('owner_id', user.id).single()
      setOrg(o)
      if (o) loadAll(sb, o.id, filtro)
    })
  }, [])

  async function loadAll(sb: any, orgId: number, f: string) {
    setLoading(true)
    const [k, c] = await Promise.all([
      getKPIsAdmin(sb, orgId),
      getCuotas(sb, orgId, { estado: f || undefined }),
    ])
    setKpis(k || {})
    setCuotas(c || [])
    setLoading(false)
  }

  function handleFiltro(f: string) {
    setFiltro(f)
    const sb = createClient()
    if (org) loadAll(sb, org.id, f)
  }

  async function handleMarcarPagada(cuotaId: number) {
    const metodo = prompt('Método de pago:', 'Transferencia') || 'Transferencia'
    const sb = createClient()
    await marcarPagada(sb, cuotaId, metodo)
    setMsg('✓ Cuota marcada como pagada')
    setTimeout(() => setMsg(''), 3000)
    if (org) loadAll(sb, org.id, filtro)
  }

  if (loading) return <div className="loader"><div className="spinner"/>Cargando...</div>

  return (
    <div>
      <div className="page-title">ADMINISTRACIÓN</div>
      <div className="page-sub">Control financiero de tu negocio</div>

      {msg && <div className="alert alert-success" style={{marginBottom:16}}>{msg}</div>}

      {/* KPIs */}
      <div className="grid-4" style={{marginBottom:24}}>
        {[
          { label:'Ingresos del mes', value:fmtCLP(kpis.ingresosDelMes||0), color:'#c8f542', icon:'💰' },
          { label:'Por cobrar',       value:fmtCLP(kpis.porCobrarDelMes||0), color:'#fbbf24', icon:'⏳' },
          { label:'Deuda total',      value:fmtCLP(kpis.totalDeuda||0),      color:'#f87171', icon:'⚠️' },
          { label:'Deudores',         value:kpis.cantDeudores||0,            color:'#f87171', icon:'👥' },
        ].map((k,i) => (
          <div key={i} className="card">
            <div style={{fontSize:20,marginBottom:8,opacity:0.4}}>{k.icon}</div>
            <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:k.label==='Ingresos del mes'||k.label==='Por cobrar'||k.label==='Deuda total'?26:36,color:k.color,lineHeight:1}}>{k.value}</div>
            <div style={{fontSize:11,textTransform:'uppercase',letterSpacing:1.5,color:'#666',marginTop:6}}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filtros cuotas */}
      <div style={{display:'flex',gap:8,marginBottom:16}}>
        {[['pendiente','Pendientes'],['pagado','Pagadas'],['vencido','Vencidas'],['','Todas']].map(([v,l]) => (
          <button key={v} onClick={() => handleFiltro(v)}
            className={`btn ${filtro===v?'btn-primary':'btn-ghost'}`}
            style={{fontSize:12,padding:'7px 14px'}}>
            {l}
          </button>
        ))}
      </div>

      {/* Tabla cuotas */}
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div style={{padding:'11px 16px',background:'rgba(255,255,255,0.02)',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr auto',gap:12,fontSize:10,letterSpacing:1.5,textTransform:'uppercase',color:'#555'}}>
          <span>Alumno</span><span>Concepto</span><span>Monto</span><span>Vencimiento</span><span>Acción</span>
        </div>
        {cuotas.length === 0 && (
          <div style={{textAlign:'center',padding:'40px',color:'#444',fontSize:13}}>
            Sin cuotas en esta categoría
          </div>
        )}
        {cuotas.map((c: any, i: number) => (
          <div key={c.id} style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr auto',gap:12,padding:'12px 16px',alignItems:'center',borderBottom:i<cuotas.length-1?'1px solid rgba(255,255,255,0.04)':'none'}}>
            <div>
              <div style={{fontSize:13,fontWeight:500}}>{c.alumno?.full_name}</div>
              <div style={{fontSize:11,color:'#666'}}>{c.alumno?.email}</div>
            </div>
            <div style={{fontSize:13,color:'#888'}}>{c.concepto||'Cuota mensual'}</div>
            <div style={{fontFamily:'"Bebas Neue",sans-serif',fontSize:20,color:'#c8f542'}}>{fmtCLP(c.monto)}</div>
            <div style={{fontSize:12,color:c.estado==='vencido'?'#f87171':'#888'}}>
              {new Date(c.fecha_vencimiento).toLocaleDateString('es-CL',{day:'numeric',month:'short',year:'2-digit'})}
            </div>
            {c.estado !== 'pagado' ? (
              <button onClick={() => handleMarcarPagada(c.id)}
                style={{background:'rgba(74,222,128,0.1)',border:'1px solid rgba(74,222,128,0.2)',color:'#4ade80',borderRadius:8,padding:'6px 12px',fontSize:11,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>
                ✓ Pagado
              </button>
            ) : (
              <span style={{fontSize:11,padding:'4px 10px',borderRadius:20,background:'rgba(74,222,128,0.1)',color:'#4ade80',whiteSpace:'nowrap'}}>✓ Cobrado</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
