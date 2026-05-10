'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import './login.css'

export default function LoginPage() {
  const router   = useRouter()
  const [mode, setMode]         = useState<'login'|'register'>('login')
  const [role, setRole]         = useState<'profe'|'alumno'>('profe')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [ok, setOk]             = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setOk(''); setLoading(true)
    const supabase = createClient()

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
        router.refresh()
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName, role } }
        })
        if (error) throw error
        setOk('¡Cuenta creada! Revisá tu email si necesitás confirmar.')
        setMode('login')
      }
    } catch (err: any) {
      setError(err.message || 'Error desconocido')
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
        {/* Tabs */}
        <div className="login-tabs">
          {(['login', 'register'] as const).map(m => (
            <button
              key={m}
              className={`login-tab ${mode === m ? 'active' : ''}`}
              onClick={() => { setMode(m); setError('') }}
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
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  placeholder="Carlos García" required autoFocus />
              </div>
              <div className="form-group">
                <label>Tipo de cuenta</label>
                <div className="role-toggle">
                  {[{v:'profe',l:'📋 Profesor'},{v:'alumno',l:'🏋️ Alumno'}].map(({v,l}) => (
                    <button key={v} type="button"
                      className={`role-btn ${role === v ? 'active' : ''}`}
                      onClick={() => setRole(v as 'profe'|'alumno')}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com" required />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required minLength={6} />
          </div>

          {error && <div className="alert-error">{error}</div>}
          {ok    && <div className="alert-ok">{ok}</div>}

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'CARGANDO...' : mode === 'login' ? 'ENTRAR' : 'CREAR CUENTA'}
          </button>
        </form>
      </div>

      <div className="login-footer">Trial gratis de 14 días · Sin tarjeta requerida</div>
    </div>
  )
}
