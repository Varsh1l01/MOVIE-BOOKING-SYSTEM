import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { authApi } from '../../services/api'
import { useAuthStore } from '../../store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })

  const loginMutation = useMutation({
    mutationFn: () => authApi.login(form),
    onSuccess: (res) => {
      const payload = res.data?.data
      if (!payload?.user || !payload?.accessToken) {
        toast.error('Invalid login response from server')
        return
      }
      setAuth(payload.user, payload.accessToken)
      toast.success('Login successful')
      navigate('/')
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Login failed'),
  })

  return (
    <div className="page-container py-10 max-w-md">
      <div className="glass-card p-6">
        <h1 className="text-2xl font-bold text-dark-100 mb-5">Login</h1>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            loginMutation.mutate()
          }}
        >
          <div>
            <label className="input-label">Email</label>
            <input className="input-field" type="email" required value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
          </div>
          <div>
            <label className="input-label">Password</label>
            <input className="input-field" type="password" required value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} />
          </div>
          <button className="btn-primary w-full" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="text-sm text-dark-400 mt-4 flex justify-between">
          <Link to="/auth/forgot-password" className="hover:text-white">Forgot password?</Link>
          <Link to="/auth/register" className="hover:text-white">Create account</Link>
        </div>
      </div>
    </div>
  )
}
