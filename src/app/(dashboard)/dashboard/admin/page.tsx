import { createClient } from '@/lib/supabase/server'

async function safeCount(supabase: any, table: string, filter?: { column: string; value: string }) {
  try {
    let query = supabase.from(table).select('*', { count: 'exact', head: true })
    if (filter) query = query.eq(filter.column, filter.value)
    const { count } = await query
    return count ?? 0
  } catch {
    return 0
  }
}

export default async function AdminPage() {
  const supabase = await createClient()

  const [academias, profes, alumnos, rutinas, sesiones, mensajes] = await Promise.all([
    safeCount(supabase, 'academias'),
    safeCount(supabase, 'profiles', { column: 'role', value: 'profe' }),
    safeCount(supabase, 'profiles', { column: 'role', value: 'alumno' }),
    safeCount(supabase, 'routines'),
    safeCount(supabase, 'workout_sessions'),
    safeCount(supabase, 'messages'),
  ])

  const cards = [
    { label: 'Academias activas', value: academias, icon: '🏢', href: '/dashboard/admin/academias' },
    { label: 'Coaches', value: profes, icon: '👨‍🏫', href: '/dashboard/admin/profes' },
    { label: 'Alumnos', value: alumnos, icon: '👥', href: '/dashboard/admin/alumnos' },
    { label: 'Rutinas creadas', value: rutinas, icon: '📋', href: '/dashboard/profe/rutinas' },
    { label: 'Sesiones registradas', value: sesiones, icon: '✅', href: '/dashboard/admin/analytics' },
    { label: 'Mensajes', value: mensajes, icon: '💬', href: '/dashboard/admin/analytics' },
  ]

  return (
    <div>
      <div className="page-title">SUPER ADMIN</div>
      <div className="page-sub">Control comercial y operacional de CALFIT</div>

      <div className="grid-3" style={{ marginBottom: 22 }}>
        {cards.map((card) => (
          <a key={card.label} href={card.href} className="card" style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <div style={{ color: '#666', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5 }}>{card.label}</div>
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 48, letterSpacing: 2, color: '#f0efe8', marginTop: 8 }}>{card.value}</div>
              </div>
              <div style={{ width: 42, height: 42, borderRadius: 14, background: 'rgba(200,245,66,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                {card.icon}
              </div>
            </div>
          </a>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: 2, fontSize: 28, marginBottom: 8 }}>Próximo paso comercial</h2>
          <p style={{ color: '#777', fontSize: 14, lineHeight: 1.7 }}>
            Crea academias demo para coaches reales. Cada academia tendrá código único para que alumnos y profesores se registren asociados a su comunidad.
          </p>
          <a href="/dashboard/admin/academias" className="btn btn-primary" style={{ marginTop: 18, textDecoration: 'none' }}>
            Crear academia
          </a>
        </div>

        <div className="card">
          <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: 2, fontSize: 28, marginBottom: 8 }}>MVP vendible</h2>
          <p style={{ color: '#777', fontSize: 14, lineHeight: 1.7 }}>
            El flujo clave es: academia → coach → alumnos → rutinas → progreso. Si eso funciona, ya puedes mostrar demos y cerrar pilotos pagados.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 18 }}>
            <span className="badge badge-lime">SaaS</span>
            <span className="badge badge-success">Multi academia</span>
            <span className="badge badge-warning">Early access</span>
          </div>
        </div>
      </div>
    </div>
  )
}
