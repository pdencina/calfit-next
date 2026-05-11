'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()

  const [isRegister, setIsRegister] = useState(false)

  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('alumno')
  const [academyCode, setAcademyCode] = useState('')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (isRegister) {
        const { data: academy } = await supabase
          .from('academias')
          .select('id')
          .eq('codigo', academyCode)
          .maybeSingle()

        if (!academy) {
          setError('Código de academia inválido')
          setLoading(false)
          return
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role,
              academia_id: academy.id,
            },
          },
        })

        if (error) {
          setError(error.message)
          setLoading(false)
          return
        }

        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email,
            full_name: fullName,
            role,
            academia_id: academy.id,
          })
        }

        setMessage('Cuenta creada correctamente')
        setLoading(false)
        return
      }

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
    } catch (err: any) {
      setError(err.message || 'Error inesperado')
    }

    setLoading(false)
  }

  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <h1 style={styles.logo}>CALFIT</h1>

        <p style={styles.subtitle}>PLATAFORMA PRO</p>

        <div style={styles.tabs}>
          <button
            style={{
              ...styles.tab,
              borderBottom: !isRegister ? '2px solid #c6ff32' : 'none',
              color: !isRegister ? '#c6ff32' : '#777',
            }}
            onClick={() => setIsRegister(false)}
          >
            INGRESAR
          </button>

          <button
            style={{
              ...styles.tab,
              borderBottom: isRegister ? '2px solid #c6ff32' : 'none',
              color: isRegister ? '#c6ff32' : '#777',
            }}
            onClick={() => setIsRegister(true)}
          >
            REGISTRARSE
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <input
                style={styles.input}
                placeholder="Nombre completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />

              <select
                style={styles.input}
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="alumno">Alumno</option>
                <option value="profe">Profesor</option>
              </select>

              <input
                style={styles.input}
                placeholder="Código academia"
                value={academyCode}
                onChange={(e) => setAcademyCode(e.target.value)}
              />
            </>
          )}

          <input
            style={styles.input}
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            style={styles.input}
            placeholder="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}

          {message && (
            <div style={styles.success}>
              {message}
            </div>
          )}

          <button style={styles.button}>
            {loading
              ? 'CARGANDO...'
              : isRegister
              ? 'CREAR CUENTA'
              : 'ENTRAR'}
          </button>
        </form>
      </div>
    </main>
  )
}

const styles: any = {
  main: {
    minHeight: '100vh',
    background: '#000',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#fff',
    fontFamily: 'Arial',
  },

  card: {
    width: '100%',
    maxWidth: '520px',
    background: '#111',
    padding: '40px',
    borderRadius: '24px',
  },

  logo: {
    color: '#c6ff32',
    fontSize: '64px',
    fontWeight: 900,
    letterSpacing: '10px',
    textAlign: 'center',
    marginBottom: '10px',
  },

  subtitle: {
    textAlign: 'center',
    color: '#666',
    letterSpacing: '6px',
    marginBottom: '30px',
  },

  tabs: {
    display: 'flex',
    marginBottom: '24px',
  },

  tab: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    padding: '16px',
    cursor: 'pointer',
    fontWeight: 700,
  },

  input: {
    width: '100%',
    padding: '16px',
    marginBottom: '14px',
    borderRadius: '12px',
    border: '1px solid #333',
    background: '#000',
    color: '#fff',
    boxSizing: 'border-box',
  },

  button: {
    width: '100%',
    padding: '18px',
    borderRadius: '14px',
    border: 'none',
    background: '#c6ff32',
    color: '#000',
    fontWeight: 900,
    marginTop: '12px',
    cursor: 'pointer',
  },

  error: {
    background: '#3b0b0b',
    color: '#ff7b7b',
    padding: '12px',
    borderRadius: '12px',
    marginBottom: '12px',
  },

  success: {
    background: '#0b3b16',
    color: '#72ff9c',
    padding: '12px',
    borderRadius: '12px',
    marginBottom: '12px',
  },
}