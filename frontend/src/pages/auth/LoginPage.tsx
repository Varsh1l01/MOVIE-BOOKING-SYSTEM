import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { authApi } from '../../services/api'
import { useAuthStore } from '../../store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const from = (location.state as any)?.from || '/'

  const loginMutation = useMutation({
    mutationFn: () => authApi.login(form),
    onSuccess: (res) => {
      const payload = res.data?.data
      if (!payload?.user || !payload?.accessToken) {
        toast.error('Invalid response from server.')
        return
      }
      setAuth(payload.user, payload.accessToken)
      toast.success(`Welcome back, ${payload.user.name}! 🎬`)
      navigate(from, { replace: true })
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Login failed. Check your credentials.'),
  })

  return (
    <div className="min-h-screen flex bg-dark-900">
      {/* Left — Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 p-12">
        {/* Ambient glow blobs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-brand-700/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-brand-500/40">
            <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 4h2v2H4V4zm0 4h2v2H4V8zm0 4h2v2H4v-2zm0 4h2v2H4v-2zM18 4h2v2h-2V4zm0 4h2v2h-2V8zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zM8 4h8v16H8V4zm2 2v12h4V6h-4z" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-white mb-2">MovieBook</h1>
          <p className="text-dark-400 text-base max-w-xs leading-relaxed">
            Your gateway to seamless movie ticket booking. Book seats, discover shows, enjoy cinema.
          </p>

          <div className="mt-12 space-y-4 w-full max-w-xs">
            {[
              { icon: '🎬', text: 'Book tickets in seconds' },
              { icon: '💺', text: 'Choose your perfect seat' },
              { icon: '🎟️', text: 'Instant booking confirmation' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-dark-300">
                <span className="text-xl">{icon}</span>
                <span className="text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form Panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 4h2v2H4V4zm0 4h2v2H4V8zm0 4h2v2H4v-2zm0 4h2v2H4v-2zM18 4h2v2h-2V4zm0 4h2v2h-2V8zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zM8 4h8v16H8V4zm2 2v12h4V6h-4z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">MovieBook</span>
          </div>

          <h2 className="text-3xl font-bold text-dark-100 mb-1">Welcome back</h2>
          <p className="text-dark-400 text-sm mb-8">Sign in to your account to continue</p>

          <form
            className="space-y-5"
            onSubmit={(e) => { e.preventDefault(); loginMutation.mutate() }}
          >
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Email address</label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 text-dark-100 placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                value={form.email}
                onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-dark-300">Password</label>
                <Link to="/auth/forgot-password" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Your password"
                  className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 pr-11 text-dark-100 placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                  value={form.password}
                  onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                />
                <button
                  type="button"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200 transition-colors"
                >
                  {showPass ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-brand-500/30"
            >
              {loginMutation.isPending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Quick test credentials hint */}
          <div className="mt-4 p-3 bg-dark-800/60 border border-dark-700 rounded-lg text-xs text-dark-400">
            <span className="font-medium text-dark-300">Demo:</span>{' '}
            <button type="button" className="text-brand-400 hover:text-brand-300" onClick={() => setForm({ email: 'admin@moviebooking.com', password: 'Admin@1234' })}>Admin</button>
            {' '}·{' '}
            <button type="button" className="text-brand-400 hover:text-brand-300" onClick={() => setForm({ email: 'john@example.com', password: 'User@1234' })}>User</button>
          </div>

          <p className="text-sm text-dark-400 text-center mt-6">
            Don't have an account?{' '}
            <Link to="/auth/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
