import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Film, Building2, Calendar, Ticket, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { authApi } from '../../services/api'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/movies', icon: Film, label: 'Movies' },
  { to: '/admin/theatres', icon: Building2, label: 'Theatres' },
  { to: '/admin/shows', icon: Calendar, label: 'Shows' },
  { to: '/admin/coupons', icon: Ticket, label: 'Coupons' },
  { to: '/admin/bookings', icon: Ticket, label: 'Bookings' },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await authApi.logout().catch(() => {})
    logout()
    navigate('/')
    toast.success('Logged out')
  }

  return (
    <div className="min-h-screen flex bg-dark-900">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-dark-800 border-r border-dark-700 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-dark-700">
          <span className="text-xl font-bold gradient-text">⚡ Admin Panel</span>
        </div>

        {/* Nav */}
        <nav className="p-4 space-y-1 flex-1">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-glow'
                    : 'text-dark-300 hover:text-white hover:bg-dark-700'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-dark-700">
          <div className="flex items-center gap-3 px-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-sm font-bold">
              {user?.name[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-dark-100 truncate">{user?.name}</p>
              <p className="text-xs text-dark-400 truncate">{user?.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-dark-300 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center gap-4 px-6 border-b border-dark-700 bg-dark-800/80 backdrop-blur-sm sticky top-0 z-30">
          <button className="lg:hidden text-dark-300 hover:text-white" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <h1 className="font-semibold text-dark-100">Admin Dashboard</h1>
          <div className="ml-auto">
            <a href="/" className="btn-ghost text-sm">← Back to Site</a>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
