'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AlumnoPerfilPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [profileId, setProfileId] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [level, setLevel] = useState('Principiante')

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/login'
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    setProfileId(data.id)
    setFullName(data.full_name || '')
    setEmail(data.email || user.email || '')
    setLevel(data.level || 'Principiante')

    setLoading(false)
  }

  async function saveProfile() {
    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        level,
      })
      .eq('id', profileId)

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    setMessage('Perfil actualizado correctamente.')
    setSaving(false)
  }

  if (loading) {
    return <div style={styles.page}>Cargando perfil...</div>
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Mi Perfil</h1>
      <p style={styles.subtitle}>Actualiza tu información básica.</p>

      {message && <div style={styles.notice}>{message}</div>}

      <div style={styles.card}>
        <label style={styles.label}>Nombre completo</label>
        <input
          style={styles.input}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <label style={styles.label}>Correo</label>
        <input style={styles.inputDisabled} value={email} disabled />

        <label style={styles.label}>Nivel</label>
        <select
          style={styles.input}
          value={level}
          onChange={(e) => setLevel(e.target.value)}
        >
          <option>Principiante</option>
          <option>Intermedio</option>
          <option>Avanzado</option>
        </select>

        <button style={styles.button} onClick={saveProfile} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 32, color: '#fff' },
  title: { fontSize: 42, fontWeight: 900, margin: 0 },
  subtitle: { color: '#8a8a8a', marginBottom: 24 },
  card: {
    background: '#111',
    border: '1px solid rgba(255,255,255,.06)',
    borderRadius: 24,
    padding: 24,
    maxWidth: 620,
  },
  label: {
    display: 'block',
    color: '#8a8a8a',
    marginBottom: 8,
    marginTop: 18,
    fontWeight: 700,
  },
  input: {
    width: '100%',
    background: '#050505',
    border: '1px solid rgba(255,255,255,.12)',
    color: '#fff',
    borderRadius: 14,
    padding: 14,
    boxSizing: 'border-box',
  },
  inputDisabled: {
    width: '100%',
    background: '#0a0a0a',
    border: '1px solid rgba(255,255,255,.08)',
    color: '#777',
    borderRadius: 14,
    padding: 14,
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    background: '#c8f542',
    color: '#000',
    border: 0,
    borderRadius: 14,
    padding: 16,
    fontWeight: 900,
    cursor: 'pointer',
    marginTop: 24,
  },
  notice: {
    background: 'rgba(200,245,66,.08)',
    border: '1px solid rgba(200,245,66,.25)',
    color: '#c8f542',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
}