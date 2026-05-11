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
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-zinc-900 rounded-3xl p-8 border border-zinc-800">
        <div className="mb-10 text-center">
          <h1 className="text-6xl font-black tracking-widest text-lime-400">
            CALFIT
          </h1>

          <p className="text-zinc-500 mt-4 tracking-[0.3em] text-sm">
            PLATAFORMA PRO
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-zinc-400 text-sm mb-2">
              EMAIL
            </label>

            <input
              type="email"
              placeholder="correo@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-4 text-white outline-none focus:border-lime-400"
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-sm mb-2">
              CONTRASEÑA
            </label>

            <input
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-4 text-white outline-none focus:border-lime-400"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 rounded-xl p-4 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-lime-400 hover:bg-lime-300 transition-all text-black font-black tracking-widest rounded-xl py-4"
          >
            {loading ? 'INGRESANDO...' : 'ENTRAR'}
          </button>
        </form>
      </div>
    </div>
  )
}