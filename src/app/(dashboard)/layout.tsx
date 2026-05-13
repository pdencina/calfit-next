import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/layout/DashboardShell'
import './dashboard.css'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    return (
      <div className="auth-error">
        <h1>Usuario autenticado, pero sin perfil</h1>
        <p>{user.email}</p>
      </div>
    )
  }

  return (
    <DashboardShell profile={profile}>
      {children}
    </DashboardShell>
  )
}