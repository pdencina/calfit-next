import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardRedirectPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    redirect('/login')
  }

  if (profile.role === 'profe') {
    redirect('/dashboard/profe')
  }

  if (profile.role === 'alumno') {
    redirect('/dashboard/alumno')
  }

  if (profile.role === 'super_admin' || profile.role === 'admin') {
    redirect('/dashboard/admin')
  }

  redirect('/login')
}