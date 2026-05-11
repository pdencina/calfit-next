'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Profile = { id: string; full_name: string; email: string; role: string }

export default function ProfeAlumnosPage() {
  const supabase = useMemo(() => createClient(), [])
  const [orgId, setOrgId] = useState<number | null>(null)
  const [students, setStudents] = useState<Profile[]>([])
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true); setError('')
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) { setError('Sesión no encontrada'); setLoading(false); return }
    const { data: org } = await supabase.from('organizations').select('id').eq('owner_id', uid).maybeSingle()
    let resolvedOrgId = org?.id as number | undefined
    if (!resolvedOrgId) {
      const { data: mem } = await supabase.from('memberships').select('org_id').eq('user_id', uid).in('role', ['owner','coach']).maybeSingle()
      resolvedOrgId = mem?.org_id as number | undefined
    }
    if (!resolvedOrgId) { setError('No encontramos tu academia.'); setLoading(false); return }
    setOrgId(resolvedOrgId)

    const { data: memberships } = await supabase.from('memberships').select('user_id').eq('org_id', resolvedOrgId).eq('role','alumno').eq('status','active')
    const ids = (memberships || []).map((m: any) => m.user_id)
    if (ids.length) {
      const { data: profs } = await supabase.from('profiles').select('id,full_name,email,role').in('id', ids).order('full_name')
      setStudents((profs || []) as Profile[])
    } else setStudents([])
    setLoading(false)
  }

  async function addExistingStudent(e: React.FormEvent) {
    e.preventDefault(); setError(''); setOk('')
    if (!orgId || !email.trim()) return
    const normalized = email.trim().toLowerCase()
    const { data: profile, error: profileError } = await supabase.from('profiles').select('id,email,full_name,role').eq('email', normalized).eq('role','alumno').maybeSingle()
    if (profileError || !profile) { setError('No encontré un alumno registrado con ese correo. Primero debe registrarse como alumno.'); return }
    const { error: insertError } = await supabase.from('memberships').upsert({ org_id: orgId, user_id: profile.id, role: 'alumno', status: 'active' }, { onConflict: 'org_id,user_id' })
    if (insertError) setError(insertError.message)
    else { setOk('Alumno agregado correctamente.'); setEmail(''); await load() }
  }

  if (loading) return <div className="loader">Cargando alumnos...</div>

  return (
    <div>
      <div className="page-title">MIS ALUMNOS</div>
      <div className="page-sub">Agrega alumnos registrados y gestiona tu comunidad.</div>
      {error && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      {ok && <div className="alert-ok" style={{ marginBottom: 16 }}>{ok}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 18 }}>
        <div className="card">
          <div style={{ fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', color: '#666', marginBottom: 16 }}>Agregar alumno existente</div>
          <form onSubmit={addExistingStudent}>
            <div className="form-group"><label>Email del alumno</label><input value={email} onChange={e => setEmail(e.target.value)} placeholder="alumno@email.com" /></div>
            <button className="btn btn-primary">AGREGAR ALUMNO</button>
          </form>
          <div style={{ fontSize: 12, color: '#666', lineHeight: 1.6, marginTop: 14 }}>Flujo actual: el alumno se registra primero, luego lo agregas por correo a tu academia.</div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}><div style={{ fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', color: '#666' }}>Alumnos activos</div><span className="badge badge-lime">{students.length}</span></div>
          {!students.length ? <div style={{ textAlign: 'center', padding: 48, color: '#444' }}>Sin alumnos todavía</div> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>{students.map(s => <div key={s.id} style={{ padding: 14, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, background: '#111' }}><div style={{ width: 38, height: 38, borderRadius: '50%', background: '#c8f542', color: '#070707', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, marginBottom: 10 }}>{(s.full_name || s.email).slice(0,2).toUpperCase()}</div><div style={{ fontWeight: 600 }}>{s.full_name || 'Alumno'}</div><div style={{ color: '#666', fontSize: 12 }}>{s.email}</div></div>)}</div>}
        </div>
      </div>
    </div>
  )
}
