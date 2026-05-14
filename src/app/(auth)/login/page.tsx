'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import './login.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    setLoading(true)
    setError('')

    const supabase = createClient()

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (loginError) throw loginError

      const user = data.user

      if (!user) {
        throw new Error('No se encontró el usuario autenticado.')
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id,email,full_name,role,academia_id')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) throw profileError

      if (!profile) {
        throw new Error('Tu usuario existe, pero no tiene perfil creado.')
      }

      if (profile.role === 'profe') {
        window.location.href = '/dashboard/profe'
        return
      }

      if (profile.role === 'alumno') {
        window.location.href = '/dashboard/alumno'
        return
      }

      if (profile.role === 'super_admin' || profile.role === 'admin') {
        window.location.href = '/dashboard/admin'
        return
      }

      throw new Error('Rol no reconocido en el perfil.')
    } catch (err: any) {
      setError(err.message || 'Error al ingresar')
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg" />

      <div className="login-brand">CALFIT</div>
      <div className="login-sub">PLATAFORMA PRO</div>

      <div className="login-box">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <div className="alert-error">{error}</div>}

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'CARGANDO...' : 'ENTRAR'}
          </button>
        </form>
      </div>
    </div>
  )
}