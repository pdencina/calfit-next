'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
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

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at top, #18210f 0%, #050505 45%, #000 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#fff'
    }}>
      <section style={{
        width: '100%',
        maxWidth: '520px',
        background: 'rgba(24,24,27,0.92)',
        border: '1px solid #2a2a2a',
        borderRadius: '28px',
        padding: '42px',
        boxShadow: '0 30px 80px rgba(0,0,0,0.55)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h1 style={{
            color: '#c6ff32',
            fontSize: '64px',
            letterSpacing: '12px',
            margin: 0,
            fontWeight: 900
          }}>
            CALFIT
          </h1>
          <p style={{
            color: '#777',
            letterSpacing: '8px',
            marginTop: '12px',
            fontSize: '13px'
          }}>
            PLATAFORMA PRO
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <label style={label}>EMAIL</label>
          <input
            style={input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@gmail.com"
          />

          <label style={label}>CONTRASEÑA</label>
          <input
            style={input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
          />

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid #ef4444',
              color: '#f87171',
              padding: '14px',
              borderRadius: '12px',
              marginBottom: '18px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: '#c6ff32',
              color: '#000',
              border: 'none',
              borderRadius: '14px',
              padding: '18px',
              fontSize: '18px',
              fontWeight: 900,
              letterSpacing: '3px',
              cursor: 'pointer'
            }}
          >
            {loading ? 'INGRESANDO...' : 'ENTRAR'}
          </button>
        </form>
      </section>
    </main>
  )
}

const label = {
  display: 'block',
  color: '#888',
  letterSpacing: '5px',
  fontSize: '13px',
  marginBottom: '10px',
  marginTop: '18px'
}

const input = {
  width: '100%',
  background: '#111',
  border: '1px solid #2f2f2f',
  color: '#fff',
  borderRadius: '14px',
  padding: '18px',
  fontSize: '16px',
  marginBottom: '12px',
  outline: 'none',
  boxSizing: 'border-box' as const
}