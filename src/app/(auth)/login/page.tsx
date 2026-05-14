'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import './login.css'

export default function LoginPage() {
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
        const { data, error } = await supabase.auth.signInWithPassword({ 
          email: email.trim(), 
          password 
        })
        if (error) throw error
        if (data.session) {
          // Esperar un momento para que las cookies se guarden
          await new Promise(r => setTimeout(r, 500))
          window.location.replace('/dashboard')
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(), 
          password,
          options: { data: { full_name: fullName, role } }
        })
        if (error) throw error
        setOk('¡Cuenta creada! Revisá tu email o iniciá sesión.')
        setMode('login')
      }
    } catch (err: any) {
      console.error('Login error:', err)
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
          {(['login', 'register'] as const).map(m => (
            <button key={m} className={`login-tab ${mode === m ? 'active' : ''}`}
              onClick={() => { setMode(m); setError('') }} type="button">
              {m === 'login' ? 'Ingresar' : 'Registrarse'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} autoComplete="on">
          {mode === 'register' && (
            <>
              <div className="form-group">
                <label>Nombre completo</label>
                <input 
                  type="text" 
                  name="name"
                  autoComplete="name"
                  value={fullName} 
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Carlos García" required autoFocus />
              </div>
              <div className="form-group">
                <label>Tipo de cuenta</label>
                <div className="role-toggle">
                  {[{v:'profe',l:'📋 Profesor'},{v:'alumno',l:'🏋️ Alumno'}].map(({v,l}) => (
                    <button key={v} type="button"
                      className={`role-btn ${role === v ? 'active' : ''}`}
                      onClick={() => setRole(v as 'profe'|'alumno')}>{l}</button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              name="email"
              autoComplete="email"
              value={email} 
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com" 
              required 
              autoFocus={mode === 'login'} />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input 
              type="password" 
              name="password"
              autoComplete="current-password"
              value={password} 
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" 
              required 
              minLength={6} />
          </div>

          {error && <div className="alert-error">{error}</div>}
          {ok    && <div className="alert-ok">{ok}</div>}

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'CARGANDO...' : mode === 'login' ? 'ENTRAR' : 'CREAR CUENTA'}
          </button>
        </form>

        {mode === 'login' && (
          <div style={{textAlign:'center', marginTop:16, fontSize:12, color:'#555'}}>
            ¿Olvidaste tu contraseña? 
            <button 
              type="button"
              onClick={async () => {
                if (!email) { setError('Ingresá tu email primero'); return }
                const sb = createClient()
                await sb.auth.resetPasswordForEmail(email.trim(), {
                  redirectTo: `${window.location.origin}/reset-password`
                })
                setOk('Email de recuperación enviado')
              }}
              style={{background:'none',border:'none',color:'#c8f542',cursor:'pointer',fontSize:12,marginLeft:4}}>
              Recuperar
            </button>
          </div>
        )}
      </div>

      <div className="login-footer">Trial gratis de 14 días · Sin tarjeta requerida</div>
    </div>
  )
}