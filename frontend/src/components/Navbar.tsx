import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, MapPin, User, Bell, LogOut, Settings, Ticket, Film, Menu, X } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../services/api'
import toast from 'react-hot-toast'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { isAuthenticated, user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await authApi.logout().catch(() => {})
    logout()
    navigate('/')
    toast.success('Logged out successfully')
    setUserMenuOpen(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  return (
    <nav className="sticky top-0 z-40 bg-dark-900/90 backdrop-blur-md border-b border-dark-700/50">
      <div className="page-container">
        <div className="flex items-center h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center shadow-glow">
              <Film size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold hidden sm:block">
              <span className="text-white">Movie</span>
              <span className="gradient-text">Book</span>
            </span>
          </Link>

          {/* Location pill */}
          <button className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-dark-800 border border-dark-700 text-dark-300 text-sm hover:border-brand-500/50 transition-all">
            <MapPin size={14} className="text-brand-500" />
            <span>Mumbai</span>
          </button>

          {/* spacer */}
          <div className="flex-1" />

          {/* Search button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-dark-800 border border-dark-700 text-dark-400 text-sm hover:border-brand-500/50 transition-all w-48 hidden md:flex"
          >
            <Search size={14} />
            <span>Search movies...</span>
            <kbd className="ml-auto text-xs bg-dark-700 px-1.5 py-0.5 rounded text-dark-500">⌘K</kbd>
          </button>

          {/* Mobile search */}
          <button className="md:hidden btn-ghost p-2" onClick={() => setSearchOpen(true)}>
            <Search size={20} />
          </button>

          {/* Auth section */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 pl-3 pr-4 py-2 rounded-full bg-dark-800 border border-dark-700 hover:border-brand-500/50 transition-all"
              >
                <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold">
                  {user?.name[0]}
                </div>
                <span className="text-sm font-medium text-dark-100 hidden md:block max-w-24 truncate">
                  {user?.name}
                </span>
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 glass-card shadow-glass border border-dark-600 py-2 z-20 animate-scale-in">
                    <div className="px-4 py-3 border-b border-dark-700">
                      <p className="font-semibold text-dark-100">{user?.name}</p>
                      <p className="text-sm text-dark-400 truncate">{user?.email}</p>
                    </div>
                    <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-dark-300 hover:text-white hover:bg-dark-700 transition-all text-sm">
                      <User size={16} /> My Profile
                    </Link>
                    <Link to="/profile?tab=bookings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-dark-300 hover:text-white hover:bg-dark-700 transition-all text-sm">
                      <Ticket size={16} /> My Bookings
                    </Link>
                    {['ADMIN', 'SUPER_ADMIN'].includes(user?.role || '') && (
                      <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-dark-300 hover:text-white hover:bg-dark-700 transition-all text-sm">
                        <Settings size={16} /> Admin Panel
                      </Link>
                    )}
                    <hr className="border-dark-700 my-2" />
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:bg-red-500/10 transition-all text-sm">
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/auth/login" className="btn-ghost text-sm px-3 py-2">Login</Link>
              <Link to="/auth/register" className="btn-primary text-sm px-4 py-2">Sign Up</Link>
            </div>
          )}
        </div>
      </div>

      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-sm" onClick={() => setSearchOpen(false)}>
          <div className="w-full max-w-lg glass-card p-2 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSearch} className="flex items-center gap-3 p-2">
              <Search size={20} className="text-dark-400 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Search for movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-dark-100 placeholder-dark-400 outline-none text-lg"
              />
              <button type="button" onClick={() => setSearchOpen(false)} className="btn-ghost p-1">
                <X size={18} />
              </button>
            </form>
          </div>
        </div>
      )}
    </nav>
  )
}
