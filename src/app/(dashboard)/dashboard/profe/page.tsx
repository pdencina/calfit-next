import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProfeDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Obtener org del profe
  const { data: org } = await supabase
    .from('organizations')
    .select('*, plans(*)')
    .eq('owner_id', user.id)
    .single()

  // KPIs básicos
  const { count: totalAlumnos } = await supabase
    .from('memberships')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', org?.id)
    .eq('role', 'alumno')
    .eq('status', 'active')

  const { count: sesiones30d } = await supabase
    .from('sesiones')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', org?.id)
    .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString())

  const { data: ultimasSesiones } = await supabase
    .from('sesiones')
    .select('*, alumno:profiles!sesiones_alumno_id_fkey(full_name), rutinas(nombre)')
    .eq('org_id', org?.id)
    .order('created_at', { ascending: false })
    .limit(6)

  const isTrial = org?.plan_status === 'trialing'
  const trialDays = org?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(org.trial_ends_at).getTime() - Date.now()) / 86400000))
    : 0

  return (
    <div>
      {/* Banner trial */}
      {isTrial && (
        <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 12, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#fbbf24' }}>⏳ Trial activo — {trialDays} días restantes</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Activá tu plan para continuar usando CALFIT PRO</div>
          </div>
          <a href="/dashboard/profe/planes" style={{ background: '#fbbf24', color: '#070707', padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            Ver planes →
          </a>
        </div>
      )}

      <div className="page-title">DASHBOARD</div>
      <div className="page-sub">{org?.name}</div>

      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Alumnos activos',  value: totalAlumnos || 0,  color: '#c8f542', icon: '👥' },
          { label: 'Sesiones 30d',     value: sesiones30d || 0,   color: '#60a5fa', icon: '⚡' },
          { label: 'Plan actual',      value: (org?.plan_id || 'starter').toUpperCase(), color: '#fbbf24', icon: '💳' },
          { label: 'Estado',           value: org?.plan_status === 'active' ? 'ACTIVO' : 'TRIAL', color: '#4ade80', icon: '✓' },
        ].map((k, i) => (
          <div key={i} className="card">
            <div style={{ fontSize: 22, marginBottom: 8, opacity: 0.4 }}>{k.icon}</div>
            <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 36, color: k.color, lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, color: '#666', marginTop: 6 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Actividad reciente */}
      <div className="card">
        <div style={{ fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', color: '#666', marginBottom: 16 }}>
          Actividad reciente
        </div>
        {!ultimasSesiones?.length ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#444', fontSize: 13 }}>
            Sin actividad aún — invitá tu primer alumno
          </div>
        ) : ultimasSesiones.map((s: any, i: number) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < ultimasSesiones.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.completada ? '#4ade80' : '#333', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{s.alumno?.full_name}</span>
              <span style={{ fontSize: 12, color: '#666', marginLeft: 8 }}>{s.rutinas?.nombre}</span>
            </div>
            <span className={`badge ${s.completada ? 'badge-success' : 'badge-warning'}`}>
              {s.completada ? 'Completada' : 'En progreso'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
