'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function LoginPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    console.log('LOGIN RESPONSE:', data)
    console.log('LOGIN ERROR:', error)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <form
        onSubmit={handleLogin}
        className="bg-zinc-900 p-10 rounded-3xl w-full max-w-md"
      >
        <h1 className="text-5xl font-bold text-lime-400 mb-8">
          CALFIT
        </h1>

        <div className="mb-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-4 rounded-xl bg-zinc-800 text-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <input
            type="password"
            placeholder="Contraseña"
            className="w-full p-4 rounded-xl bg-zinc-800 text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <div className="mb-4 text-red-500">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-lime-400 text-black font-bold p-4 rounded-xl"
        >
          {loading ? 'Ingresando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}