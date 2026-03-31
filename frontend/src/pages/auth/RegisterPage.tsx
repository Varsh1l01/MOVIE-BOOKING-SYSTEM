import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { authApi } from '../../services/api'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })

  const registerMutation = useMutation({
    mutationFn: () => authApi.register(form),
    onSuccess: () => {
      toast.success('Registered successfully. Verify OTP now.')
      navigate(`/auth/verify-otp?email=${encodeURIComponent(form.email)}&purpose=EMAIL_VERIFY`)
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Registration failed'),
  })

  return (
    <div className="page-container py-10 max-w-md">
      <div className="glass-card p-6">
        <h1 className="text-2xl font-bold text-dark-100 mb-5">Create Account</h1>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); registerMutation.mutate() }}>
          <div><label className="input-label">Name</label><input className="input-field" required value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} /></div>
          <div><label className="input-label">Email</label><input className="input-field" type="email" required value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} /></div>
          <div><label className="input-label">Phone</label><input className="input-field" required value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} /></div>
          <div><label className="input-label">Password</label><input className="input-field" type="password" required value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} /></div>
          <button className="btn-primary w-full" disabled={registerMutation.isPending}>
            {registerMutation.isPending ? 'Creating...' : 'Create Account'}
          </button>
        </form>
        <div className="text-sm text-dark-400 mt-4">
          Already have an account? <Link to="/auth/login" className="hover:text-white">Login</Link>
        </div>
      </div>
    </div>
  )
}
