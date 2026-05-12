'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function JoinAcademyPage() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [academyCode, setAcademyCode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: academy } = await supabase
      .from('academias')
      .select('id')
      .eq('codigo', academyCode.trim().toUpperCase())
      .maybeSingle()

    if (!academy) {
      setError('Código de invitación inválido. Pídeselo a tu coach.')
      setLoading(false)
      return
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError || !authData.user) {
      setError(authError?.message || 'No se pudo crear tu cuenta.')
      setLoading(false)
      return
    }

    const user = authData.user

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: fullName,
      email,
      role: 'alumno',
      academia_id: academy.id,
    })

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard/alumno')
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.logo}>CALFIT</h1>
        <h2 style={styles.title}>Únete a tu academia</h2>
        <p style={styles.subtitle}>
          Ingresa el código de invitación que te entregó tu coach.
        </p>

        <form onSubmit={handleJoin}>
          <input style={styles.input} placeholder="Nombre completo" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <input style={styles.input} placeholder="Código de invitación Ej: CALFIT-1234" value={academyCode} onChange={(e) => setAcademyCode(e.target.value.toUpperCase())} required />
          <input style={styles.input} type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input style={styles.input} type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />

          {error && <div style={styles.error}>{error}</div>}

          <button style={styles.button} disabled={loading}>
            {loading ? 'CREANDO...' : 'CREAR CUENTA DE ALUMNO'}
          </button>
        </form>
      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#000',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#fff',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    background: '#111',
    padding: 42,
    borderRadius: 28,
  },
  logo: {
    color: '#c8f542',
    fontSize: 60,
    fontWeight: 900,
    letterSpacing: 8,
    textAlign: 'center',
  },
  title: {
    textAlign: 'center',
    fontSize: 34,
  },
  subtitle: {
    textAlign: 'center',
    color: '#888',
    marginBottom: 28,
  },
  input: {
    width: '100%',
    padding: 16,
    borderRadius: 14,
    border: '1px solid #333',
    background: '#000',
    color: '#fff',
    marginBottom: 14,
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: 18,
    borderRadius: 14,
    border: 0,
    background: '#c8f542',
    color: '#000',
    fontWeight: 900,
    cursor: 'pointer',
  },
  error: {
    background: '#3b0b0b',
    color: '#ff7b7b',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
}