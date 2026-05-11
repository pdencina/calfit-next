'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Academia = {
  id: string
  name?: string | null
  nombre?: string | null
  codigo?: string | null
  color?: string | null
  plan?: string | null
  is_active?: boolean | null
  created_at?: string | null
}

function makeCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default function AcademiasPage() {
  const supabase = createClient()
  const [items, setItems] = useState<Academia[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const [form, setForm] = useState({
    name: '',
    codigo: makeCode(),
    plan: 'founder',
    color: '#c8f542',
  })

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('academias')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) setError(error.message)
    setItems(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function createAcademia(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setCopied('')

    const payload = {
      name: form.name.trim(),
      nombre: form.name.trim(),
      codigo: form.codigo.trim().toUpperCase(),
      color: form.color,
      plan: form.plan,
      is_active: true,
    }

    const { error } = await supabase.from('academias').insert(payload)

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    setForm({ name: '', codigo: makeCode(), plan: 'founder', color: '#c8f542' })
    setSaving(false)
    load()
  }

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(''), 1800)
  }

  return (
    <div>
      <div className="page-title">ACADEMIAS</div>
      <div className="page-sub">Crea academias, genera códigos y asocia coaches/alumnos automáticamente.</div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <form onSubmit={createAcademia} className="card">
          <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, letterSpacing: 2, marginBottom: 16 }}>
            Nueva academia
          </h2>

          <div className="form-group">
            <label>Nombre comercial</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej: Bar Brothers Puente Alto"
              required
            />
          </div>

          <div className="form-group">
            <label>Código de registro</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
                required
              />
              <button
                className="btn"
                type="button"
                onClick={() => setForm({ ...form, codigo: makeCode() })}
              >
                Generar
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Plan</label>
            <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
              <option value="founder">Founder</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="white_label">White Label</option>
            </select>
          </div>

          <div className="form-group">
            <label>Color marca</label>
            <input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          </div>

          <button className="btn btn-primary" disabled={saving} type="submit">
            {saving ? 'Creando...' : 'Crear academia'}
          </button>
        </form>

        <div className="card">
          <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, letterSpacing: 2, marginBottom: 16 }}>
            Academias creadas
          </h2>

          {loading ? (
            <div className="loader"><span className="spinner" /> Cargando...</div>
          ) : items.length === 0 ? (
            <div className="empty">
              <div className="empty-title">Sin academias</div>
              <div className="empty-sub">Crea la primera academia piloto</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {items.map((a) => {
                const code = a.codigo || 'SIN-CODIGO'
                return (
                  <div
                    key={a.id}
                    style={{
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 14,
                      padding: 16,
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800 }}>{a.nombre || a.name || 'Sin nombre'}</div>
                      <div style={{ color: '#666', fontSize: 12, marginTop: 5 }}>
                        Código para registro:{' '}
                        <b style={{ color: '#c8f542', letterSpacing: 1 }}>{code}</b>
                      </div>
                      <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                        Entrenadores y alumnos usan este código en Registrarse.
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className="badge badge-lime">{a.plan || 'starter'}</span>
                      <button className="btn" type="button" onClick={() => copyCode(code)}>
                        {copied === code ? 'Copiado' : 'Copiar'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
