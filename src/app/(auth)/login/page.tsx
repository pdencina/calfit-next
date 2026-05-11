'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import './login.css'

type Mode = 'login' | 'register'
type Role = 'profe' | 'alumno'

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [role, setRole] = useState<Role>('alumno')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [academyCode, setAcademyCode] = useState('ASD123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setOk('')
    setLoading(true)

    const supabase = createClient()

    try {
      const cleanEmail = email.trim().toLowerCase()
      const cleanCode = academyCode.trim().toUpperCase()

      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        })

        if (error) throw error

        window.location.href = '/dashboard'
        return
      }

      const { data: academia, error: academyError } = await supabase
        .from('academias')
        .select('id,codigo,nombre,name')
        .eq('codigo', cleanCode)
        .eq('is_active', true)
        .maybeSingle()

      if (academyError) throw academyError

      if (!academia) {
        throw new Error('El código de academia no existe o no está activo.')
      }

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role,
            academia_code: cleanCode,
          },
        },
      })

      if (error) throw error

      // Si Supabase tiene confirmación de email desactivada, habrá sesión inmediata.
      if (data.session) {
        window.location.href = '/dashboard'
        return
      }

      setOk('Cuenta creada. Revisa tu correo para confirmar el acceso.')
      setMode('login')
    } catch (err: any) {
      setError(err?.message || 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg" />

      <div className="login-brand">CALFIT</div>
      <div className="login-sub">PLATAFORMA PRO</div>

      <div className="login-box">
        <div className="login-tabs">
          <button
            className={`login-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login')
              setError('')
              setOk('')
            }}
            type="button"
          >
            Ingresar
          </button>

          <button
            className={`login-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => {
              setMode('register')
              setError('')
              setOk('')
            }}
            type="button"
          >
            Registrarse
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <div className="form-group">
                <label>Nombre completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej: Jorge Pérez"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Tipo de cuenta</label>
                <div className="role-toggle">
                  <button
                    type="button"
                    className={`role-btn ${role === 'alumno' ? 'active' : ''}`}
                    onClick={() => setRole('alumno')}
                  >
                    🏋️ Alumno
                  </button>

                  <button
                    type="button"
                    className={`role-btn ${role === 'profe' ? 'active' : ''}`}
                    onClick={() => setRole('profe')}
                  >
                    📋 Profesor
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Código de academia</label>
                <input
                  type="text"
                  value={academyCode}
                  onChange={(e) => setAcademyCode(e.target.value.toUpperCase())}
                  placeholder="Ej: ASD123"
                  required
                />
                <small className="helper-text">Este código lo entrega el coach o administrador.</small>
              </div>
            </>
          )}

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
              minLength={6}
            />
          </div>

          {error && <div className="alert-error">{error}</div>}
          {ok && <div className="alert-ok">{ok}</div>}

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'CARGANDO...' : mode === 'login' ? 'ENTRAR' : 'CREAR CUENTA'}
          </button>
        </form>
      </div>

      <div className="login-footer">Trial gratis de 14 días · Sin tarjeta requerida</div>
    </div>
  )
}
