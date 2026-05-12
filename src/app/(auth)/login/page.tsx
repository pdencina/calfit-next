'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    window.location.href = '/dashboard'
  }

  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <h1 style={styles.logo}>CALFIT</h1>

        <p style={styles.subtitle}>PLATAFORMA PRO</p>

        <h2 style={styles.title}>Ingresar</h2>

        <p style={styles.description}>
          Accede a tu panel de coach o alumno.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            style={styles.input}
            placeholder="Correo"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            style={styles.input}
            placeholder="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <div style={styles.error}>{error}</div>}

          <button style={styles.button} disabled={loading}>
            {loading ? 'INGRESANDO...' : 'ENTRAR'}
          </button>
        </form>

        <div style={styles.divider} />

        <div style={styles.registerBox}>
          <p style={styles.registerText}>
            ¿Eres coach y quieres crear tu academia?
          </p>

          <Link href="/register-coach" style={styles.registerButton}>
            EMPEZAR GRATIS
          </Link>
        </div>
      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: '100vh',
    background: '#000',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#fff',
    fontFamily: 'Arial',
    padding: 20,
  },

  card: {
    width: '100%',
    maxWidth: 520,
    background: '#111',
    padding: 42,
    borderRadius: 28,
    border: '1px solid rgba(255,255,255,.06)',
  },

  logo: {
    color: '#c6ff32',
    fontSize: 64,
    fontWeight: 900,
    letterSpacing: 10,
    textAlign: 'center',
    marginBottom: 10,
  },

  subtitle: {
    textAlign: 'center',
    color: '#666',
    letterSpacing: 6,
    marginBottom: 34,
  },

  title: {
    color: '#fff',
    fontSize: 30,
    margin: 0,
    marginBottom: 8,
    textAlign: 'center',
  },

  description: {
    color: '#777',
    textAlign: 'center',
    marginBottom: 28,
  },

  input: {
    width: '100%',
    padding: 16,
    marginBottom: 14,
    borderRadius: 14,
    border: '1px solid #333',
    background: '#000',
    color: '#fff',
    boxSizing: 'border-box',
  },

  button: {
    width: '100%',
    padding: 18,
    borderRadius: 14,
    border: 'none',
    background: '#c6ff32',
    color: '#000',
    fontWeight: 900,
    marginTop: 12,
    cursor: 'pointer',
  },

  error: {
    background: '#3b0b0b',
    color: '#ff7b7b',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },

  divider: {
    height: 1,
    background: 'rgba(255,255,255,.08)',
    margin: '28px 0',
  },

  registerBox: {
    textAlign: 'center',
  },

  registerText: {
    color: '#777',
    marginBottom: 14,
  },

  registerButton: {
    display: 'block',
    width: '100%',
    padding: 16,
    borderRadius: 14,
    border: '1px solid rgba(198,255,50,.45)',
    color: '#c6ff32',
    textDecoration: 'none',
    fontWeight: 900,
    boxSizing: 'border-box',
  },
}
