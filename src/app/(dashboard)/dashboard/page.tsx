'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DashboardRedirectPage() {
  useEffect(() => {
    async function redirectByRole() {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/login'
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile) {
        window.location.href = '/login'
        return
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

      window.location.href = '/login'
    }

    redirectByRole()
  }, [])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#000',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      Redirigiendo...
    </div>
  )
}