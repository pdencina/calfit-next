'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import './login.css'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [role, setRole] = useState<'profe' | 'alumno'>('profe')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
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
      // LOGIN
      if (mode === 'login') {
        const { data, error } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          })

        if (error) throw error

        const user = data.user

        if (!user) {
          throw new Error('Usuario no encontrado')
        }

        // BUSCAR PERFIL
        const { data: profile, error: profileError } =
          await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle()

        if (profileError) {
          throw profileError
        }

        if (!profile) {
          throw new Error('Perfil no encontrado')
        }

        // ESPERAR SESSION
        await new Promise((r) => setTimeout(r, 800))

        // REDIRECCIÓN SEGÚN ROL
        if (profile.role === 'profe') {
          window.location.href = '/dashboard/profe'
          return
        }

        if (profile.role === 'alumno') {
          window.location.href = '/dashboard/alumno'
          return
        }

        // fallback
        window.location.href = '/dashboard'
      }

      // REGISTER
      else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName,
              role,
            },
          },
        })

        if (error) throw error

        setOk('Cuenta creada correctamente')
        setMode('login')
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error al ingresar')
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
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              className={`login-tab ${mode === m ? 'active' : ''}`}
              onClick={() => {
                setMode(m)
                setError('')
              }}
              type="button"
            >
              {m === 'login' ? 'Ingresar' : 'Registrarse'}
            </button>
          ))}
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
                  placeholder="Carlos García"
                  required
                />
              </div>

              <div className="form-group">
                <label>Tipo de cuenta</label>

                <div className="role-toggle">
                  <button
                    type="button"
                    className={`role-btn ${
                      role === 'profe' ? 'active' : ''
                    }`}
                    onClick={() => setRole('profe')}
                  >
                    📋 Profesor
                  </button>

                  <button
                    type="button"
                    className={`role-btn ${
                      role === 'alumno' ? 'active' : ''
                    }`}
                    onClick={() => setRole('alumno')}
                  >
                    🏋️ Alumno
                  </button>
                </div>
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
            />
          </div>

          {error && (
            <div className="alert-error">
              {error}
            </div>
          )}

          {ok && (
            <div className="alert-ok">
              {ok}
            </div>
          )}

          <button
            type="submit"
            className="btn-login"
            disabled={loading}
          >
            {loading
              ? 'CARGANDO...'
              : mode === 'login'
              ? 'ENTRAR'
              : 'CREAR CUENTA'}
          </button>
        </form>
      </div>

      <div className="login-footer">
        Trial gratis de 14 días · Sin tarjeta requerida
      </div>
    </div>
  )
}