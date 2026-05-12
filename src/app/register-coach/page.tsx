'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RegisterCoachPage() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [academyName, setAcademyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // 1. crear usuario auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      const user = authData.user

      if (!user) {
        setError('No se pudo crear el usuario.')
        setLoading(false)
        return
      }

      // 2. crear academia
      const academyCode =
        academyName
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '') +
        '-' +
        Math.floor(Math.random() * 9999)

      const { data: academy, error: academyError } = await supabase
        .from('academias')
        .insert({
          nombre: academyName,
          codigo: academyCode,
          owner_id: user.id,
        })
        .select()
        .single()

      if (academyError) {
        setError(academyError.message)
        setLoading(false)
        return
      }

      // 3. crear profile coach
      const { error: profileError } = await supabase.from('profiles').insert({
        id: user.id,
        full_name: fullName,
        email,
        role: 'profe',
        academia_id: academy.id,
        plan: 'trial',
      })

      if (profileError) {
        setError(profileError.message)
        setLoading(false)
        return
      }

      // 4. membresía organization
      const { error: membershipError } = await supabase
        .from('organization_members')
        .insert({
          org_id: academy.id,
          user_id: user.id,
          role: 'owner',
          status: 'active',
        })

      if (membershipError) {
        setError(membershipError.message)
        setLoading(false)
        return
      }

      // 5. subscription trial
      const trialEnd = new Date()
      trialEnd.setDate(trialEnd.getDate() + 14)

      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          org_id: academy.id,
          owner_user_id: user.id,
          plan: 'trial',
          status: 'active',
          trial_ends_at: trialEnd.toISOString(),
        })

      if (subscriptionError) {
        setError(subscriptionError.message)
        setLoading(false)
        return
      }

      setSuccess('Academia creada correctamente 🚀')

      setTimeout(() => {
        router.push('/dashboard/profe')
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Error inesperado')
    }

    setLoading(false)
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>CALFIT</div>

        <h1 style={styles.title}>Crea tu academia</h1>

        <p style={styles.subtitle}>
          Empieza gratis y administra tus alumnos, rutinas y métricas desde un
          solo lugar.
        </p>

        <form onSubmit={handleRegister} style={styles.form}>
          <input
            placeholder="Nombre completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            style={styles.input}
          />

          <input
            placeholder="Nombre academia"
            value={academyName}
            onChange={(e) => setAcademyName(e.target.value)}
            required
            style={styles.input}
          />

          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />

          {error && <div style={styles.error}>{error}</div>}

          {success && <div style={styles.success}>{success}</div>}

          <button disabled={loading} style={styles.button}>
            {loading ? 'CREANDO...' : 'CREAR ACADEMIA'}
          </button>
        </form>

        <div style={styles.bottom}>
          ¿Ya tienes cuenta?{' '}
          <a href="/login" style={styles.link}>
            Ingresar
          </a>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  card: {
    width: '100%',
    maxWidth: 520,
    background: '#0b0b0b',
    border: '1px solid rgba(255,255,255,.06)',
    borderRadius: 32,
    padding: 40,
  },

  logo: {
    color: '#c8f542',
    fontSize: 64,
    fontWeight: 900,
    letterSpacing: 6,
    textAlign: 'center',
    marginBottom: 10,
  },

  title: {
    color: '#fff',
    fontSize: 42,
    textAlign: 'center',
    marginBottom: 10,
  },

  subtitle: {
    color: '#777',
    textAlign: 'center',
    lineHeight: 1.6,
    marginBottom: 32,
  },

  form: {
    display: 'grid',
    gap: 16,
  },

  input: {
    background: '#111',
    border: '1px solid rgba(255,255,255,.08)',
    borderRadius: 14,
    padding: 16,
    color: '#fff',
    fontSize: 15,
    outline: 'none',
  },

  button: {
    background: '#c8f542',
    color: '#000',
    border: 0,
    borderRadius: 14,
    padding: 18,
    fontWeight: 900,
    cursor: 'pointer',
    marginTop: 8,
  },

  error: {
    background: 'rgba(255,0,0,.08)',
    border: '1px solid rgba(255,0,0,.2)',
    color: '#ff6b6b',
    padding: 14,
    borderRadius: 12,
  },

  success: {
    background: 'rgba(200,245,66,.08)',
    border: '1px solid rgba(200,245,66,.2)',
    color: '#c8f542',
    padding: 14,
    borderRadius: 12,
  },

  bottom: {
    marginTop: 24,
    textAlign: 'center',
    color: '#777',
  },

  link: {
    color: '#c8f542',
    textDecoration: 'none',
  },
}