import Sidebar from '@/components/layout/Sidebar'
import './dashboard.css'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const safeProfile = {
    id: 'super-admin-demo',
    email: 'encinaacevedo.pablo@gmail.com',
    full_name: 'Pablo Encina',
    role: 'super_admin',
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