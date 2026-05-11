import Sidebar from '@/components/layout/Sidebar'
import './dashboard.css'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const safeProfile = {
    id: 'demo',
    email: 'encinaacevedo.pablo@gmail.com',
    full_name: 'Pablo Encina',
    role: 'profe',
  }

  return (
    <div className="app-shell">
      <Sidebar profile={safeProfile} />
      <div className="main-content">
        {children}
      </div>
    </div>
  )
}