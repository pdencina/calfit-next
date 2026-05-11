import { createClient } from '@/lib/supabase/server'

export default async function AlumnosPage() {
  const supabase = await createClient()
  const { data: alumnos } = await supabase
    .from('profiles')
    .select('id,email,full_name,role,academia_id,created_at')
    .eq('role', 'alumno')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="page-title">ALUMNOS</div>
      <div className="page-sub">Usuarios alumnos registrados en CALFIT</div>

      <div className="card">
        {!alumnos || alumnos.length === 0 ? (
          <div className="empty"><div className="empty-title">Sin alumnos</div><div className="empty-sub">Los alumnos aparecerán aquí al registrarse con código de academia</div></div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {alumnos.map((p: any) => (
              <div key={p.id} style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 14, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{p.full_name || p.email}</div>
                  <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>{p.email}</div>
                </div>
                <span className="badge badge-lime">alumno</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
