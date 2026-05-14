import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
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

  if (!profile?.role) {
    redirect('/login')
  }

  const role = String(profile.role).toLowerCase().trim()

  if (role === 'profe') {
    redirect('/dashboard/profe')
  }

  if (role === 'alumno') {
    redirect('/dashboard/alumno')
  }

  if (role === 'super_admin' || role === 'admin') {
    redirect('/dashboard/admin')
  }

  redirect('/login')
}