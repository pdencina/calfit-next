'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('encinaacevedo.pablo@gmail.com')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      console.log('LOGIN DATA:', data)
      console.log('LOGIN ERROR:', error)

      if (error) {
        setErrorMsg(error.message)
        setLoading(false)
        return
      }

      window.location.href = '/dashboard'
    } catch (err: any) {
      console.error('LOGIN CATCH:', err)
      setErrorMsg(err?.message || 'Error inesperado al iniciar sesión')
      setLoading(false)
    }
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at top, #18210f 0%, #050505 45%, #000 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: 'Arial, sans-serif',
      color: '#fff'
    }}>
      <section style={{
        width: '100%',
        maxWidth: 520,
        background: 'rgba(24,24,27,0.94)',
        border: '1px solid #2a2a2a',
        borderRadius: 28,
        padding: 42
      }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h1 style={{ color: '#c6ff32', fontSize: 64, letterSpacing: 12, margin: 0, fontWeight: 900 }}>
            CALFIT
          </h1>
          <p style={{ color: '#777', letterSpacing: 8, marginTop: 12, fontSize: 13 }}>
            PLATAFORMA PRO
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <label style={label}>EMAIL</label>
          <input style={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

          <label style={label}>CONTRASEÑA</label>
          <input style={input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

          {errorMsg && (
            <div style={{
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid #ef4444',
              color: '#f87171',
              padding: 14,
              borderRadius: 12,
              marginBottom: 18
            }}>
              {errorMsg}
            </div>
          )}

          <button type="submit" disabled={loading} style={button}>
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
  letterSpacing: 5,
  fontSize: 13,
  marginBottom: 10,
  marginTop: 18
}

const input = {
  width: '100%',
  background: '#111',
  border: '1px solid #2f2f2f',
  color: '#fff',
  borderRadius: 14,
  padding: 18,
  fontSize: 16,
  marginBottom: 12,
  outline: 'none',
  boxSizing: 'border-box' as const
}

const button = {
  width: '100%',
  background: '#c6ff32',
  color: '#000',
  border: 'none',
  borderRadius: 14,
  padding: 18,
  fontSize: 18,
  fontWeight: 900,
  letterSpacing: 3,
  cursor: 'pointer'
}