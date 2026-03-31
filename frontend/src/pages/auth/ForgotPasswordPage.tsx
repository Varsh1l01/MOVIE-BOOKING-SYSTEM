import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { authApi } from '../../services/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const requestMutation = useMutation({
    mutationFn: () => authApi.forgotPassword({ email }),
    onSuccess: () => toast.success('If account exists, OTP was sent'),
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to request OTP'),
  })

  const resetMutation = useMutation({
    mutationFn: () => authApi.resetPassword({ email, code: otp, newPassword }),
    onSuccess: () => toast.success('Password reset complete. Please login.'),
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Password reset failed'),
  })

  return (
    <div className="page-container py-10 max-w-md">
      <div className="glass-card p-6 space-y-4">
        <h1 className="text-2xl font-bold text-dark-100">Forgot Password</h1>
        <div><label className="input-label">Email</label><input className="input-field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <button className="btn-ghost w-full" onClick={() => requestMutation.mutate()} disabled={requestMutation.isPending || !email}>
          {requestMutation.isPending ? 'Sending OTP...' : 'Send OTP'}
        </button>
        <div><label className="input-label">OTP</label><input className="input-field" value={otp} onChange={(e) => setOtp(e.target.value)} /></div>
        <div><label className="input-label">New Password</label><input className="input-field" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
        <button className="btn-primary w-full" onClick={() => resetMutation.mutate()} disabled={resetMutation.isPending || !email || !otp || !newPassword}>
          {resetMutation.isPending ? 'Resetting...' : 'Reset Password'}
        </button>
      </div>
    </div>
  )
}
