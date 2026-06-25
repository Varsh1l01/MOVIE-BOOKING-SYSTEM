import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { authApi } from '../../services/api'

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', ok: password.length >= 8 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', ok: /[a-z]/.test(password) },
    { label: 'Number', ok: /\d/.test(password) },
    { label: 'Special character (@$!%*?&)', ok: /[@$!%*?&]/.test(password) },
  ]
  const score = checks.filter((c) => c.ok).length
  const color = score <= 1 ? 'bg-red-500' : score <= 3 ? 'bg-yellow-500' : 'bg-green-500'
  const label = score <= 1 ? 'Weak' : score <= 3 ? 'Medium' : 'Strong'

  if (!password) return null
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1.5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < score ? color : 'bg-dark-700'}`} />
        ))}
      </div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-dark-400">{label} password</span>
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
        {checks.map(({ label, ok }) => (
          <div key={label} className={`flex items-center gap-1 text-xs ${ok ? 'text-green-400' : 'text-dark-500'}`}>
            <span>{ok ? '✓' : '○'}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [agreed, setAgreed] = useState(false)

  const registerMutation = useMutation({
    mutationFn: () => authApi.register(form),
    onSuccess: () => {
      toast.success('Account created! Check your email for the OTP 📧')
      navigate(`/auth/verify-otp?email=${encodeURIComponent(form.email)}&purpose=EMAIL_VERIFY`)
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Registration failed. Try again.'),
  })

  const isValid =
    form.name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
    /^[6-9]\d{9}$/.test(form.phone) &&
    form.password.length >= 8 &&
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(form.password) &&
    agreed

  return (
    <div className="min-h-screen flex bg-dark-900">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-5/12 relative flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 p-12">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-brand-700/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-brand-500/40">
            <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 4h2v2H4V4zm0 4h2v2H4V8zm0 4h2v2H4v-2zm0 4h2v2H4v-2zM18 4h2v2h-2V4zm0 4h2v2h-2V8zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zM8 4h8v16H8V4zm2 2v12h4V6h-4z" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-white mb-2">Join CineMaa</h1>
          <p className="text-dark-400 text-base max-w-xs leading-relaxed">
            Create your free account and start booking movie tickets instantly.
          </p>
          <div className="mt-10 space-y-3 w-full max-w-xs text-left">
            {[
              { icon: '🔒', text: 'Your data is fully encrypted' },
              { icon: '📧', text: 'Email verified for security' },
              { icon: '🎫', text: 'Instant e-ticket delivery' },
              { icon: '🏷️', text: 'Exclusive member discounts' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-dark-300 text-sm">
                <span>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-6 lg:hidden">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 4h2v2H4V4zm0 4h2v2H4V8zm0 4h2v2H4v-2zm0 4h2v2H4v-2zM18 4h2v2h-2V4zm0 4h2v2h-2V8zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zM8 4h8v16H8V4zm2 2v12h4V6h-4z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">CineMaa</span>
          </div>

          <h2 className="text-3xl font-bold text-dark-100 mb-1">Create account</h2>
          <p className="text-dark-400 text-sm mb-7">Start booking tickets in minutes</p>

          <form
            className="space-y-4"
            onSubmit={(e) => { e.preventDefault(); if (isValid) registerMutation.mutate() }}
          >
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Full name</label>
              <input
                id="reg-name"
                type="text"
                required
                autoComplete="name"
                placeholder="John Doe"
                className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 text-dark-100 placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Email address</label>
              <input
                id="reg-email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 text-dark-100 placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                value={form.email}
                onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Phone number</label>
              <div className="flex">
                <span className="flex items-center px-3 bg-dark-700 border border-r-0 border-dark-600 rounded-l-xl text-dark-400 text-sm select-none">+91</span>
                <input
                  id="reg-phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  placeholder="9876543210"
                  maxLength={10}
                  className="flex-1 bg-dark-800 border border-dark-600 rounded-r-xl px-4 py-3 text-dark-100 placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                  value={form.phone}
                  onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value.replace(/\D/g, '') }))}
                />
              </div>
              {form.phone && !/^[6-9]\d{9}$/.test(form.phone) && (
                <p className="text-xs text-red-400 mt-1">Must be a valid 10-digit Indian number starting with 6–9</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPass ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 pr-11 text-dark-100 placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                  value={form.password}
                  onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200"
                >
                  {showPass ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
              <PasswordStrength password={form.password} />
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  id="reg-terms"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${agreed ? 'bg-brand-500 border-brand-500' : 'border-dark-500 group-hover:border-dark-400'}`}>
                  {agreed && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
              </div>
              <span className="text-sm text-dark-400">
                I agree to the{' '}
                <span className="text-brand-400 hover:text-brand-300 cursor-pointer">Terms of Service</span>
                {' '}and{' '}
                <span className="text-brand-400 hover:text-brand-300 cursor-pointer">Privacy Policy</span>
              </span>
            </label>

            {/* Submit */}
            <button
              id="reg-submit"
              type="submit"
              disabled={!isValid || registerMutation.isPending}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-brand-500/30"
            >
              {registerMutation.isPending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Creating account...
                </>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="text-sm text-dark-400 text-center mt-6">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
