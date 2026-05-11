import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
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
      <div style={{ padding: 40, color: 'white', background: '#000', minHeight: '100vh' }}>
        <h1>Usuario autenticado, pero sin perfil</h1>
        <p>{user.email}</p>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Sidebar profile={profile} />
      <main className="main-content">{children}</main>
    </div>
  )
}