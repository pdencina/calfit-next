export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AlumnoDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('full_name,email').eq('id', user.id).single()
  const { data: membership } = await supabase.from('memberships').select('org_id').eq('user_id', user.id).eq('status','active').maybeSingle()
  const orgId = membership?.org_id

  const { count: rutinasActivas } = await supabase.from('rutinas').select('*', { count: 'exact', head: true }).eq('alumno_id', user.id).eq('activa', true)
  const { count: sesionesCompletadas } = await supabase.from('sesiones').select('*', { count: 'exact', head: true }).eq('alumno_id', user.id).eq('completada', true)
  const { data: ultimasRutinas } = await supabase.from('rutinas').select('id,nombre,descripcion,categoria,created_at').eq('alumno_id', user.id).eq('activa', true).order('created_at', { ascending: false }).limit(4)

  return (
    <div>
      <div className="page-title">MI ENTRENAMIENTO</div>
      <div className="page-sub">Hola {profile?.full_name || profile?.email}, este es tu panel de alumno.</div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="card"><div style={kpiValue}>{rutinasActivas || 0}</div><div style={kpiLabel}>Rutinas activas</div></div>
        <div className="card"><div style={kpiValue}>{sesionesCompletadas || 0}</div><div style={kpiLabel}>Sesiones completadas</div></div>
        <div className="card"><div style={kpiValue}>{orgId ? 'ACTIVA' : 'PENDIENTE'}</div><div style={kpiLabel}>Academia</div></div>
        <div className="card"><div style={kpiValue}>CALFIT</div><div style={kpiLabel}>Comunidad</div></div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', color: '#666' }}>Próximas rutinas</div>
          <a href="/dashboard/alumno/rutinas" style={{ color: '#c8f542', fontSize: 13, textDecoration: 'none' }}>Ver todas →</a>
        </div>
        {!ultimasRutinas?.length ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#444' }}>Tu profesor aún no te asigna rutinas.</div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {ultimasRutinas.map((r: any) => (
              <a key={r.id} href="/dashboard/alumno/rutinas" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, background: '#111' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{r.nombre}</div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 3 }}>{r.descripcion || 'Sin descripción'}</div>
                </div>
                <span className="badge badge-lime">{r.categoria}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const kpiValue: React.CSSProperties = { fontFamily: 'Bebas Neue', fontSize: 34, color: '#c8f542', lineHeight: 1 }
const kpiLabel: React.CSSProperties = { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, color: '#666', marginTop: 8 }
