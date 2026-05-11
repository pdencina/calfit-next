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

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  const safeProfile = profile ?? {
    id: user.id,
    email: user.email,
    full_name: user.email?.split('@')[0] ?? 'Usuario',
    role: 'alumno',
    academia_id: null,
  }

  return (
    <div className="app-shell">
      <Sidebar profile={safeProfile} />

      <main className="main-content">
        {children}
      </main>
    </div>
  )
}