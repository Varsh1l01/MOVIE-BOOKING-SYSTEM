import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { authApi } from '../../services/api'

export default function OtpVerifyPage() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  const purpose = searchParams.get('purpose') || 'EMAIL_VERIFY'
  const [code, setCode] = useState('')

  const verifyMutation = useMutation({
    mutationFn: () => authApi.verifyOtp({ email, code, purpose }),
    onSuccess: () => toast.success('OTP verified successfully'),
    onError: (err: any) => toast.error(err?.response?.data?.message || 'OTP verification failed'),
  })

  const resendMutation = useMutation({
    mutationFn: () => authApi.sendOtp({ email, purpose }),
    onSuccess: () => toast.success('OTP resent'),
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to resend OTP'),
  })

  return (
    <div className="page-container py-10 max-w-md">
      <div className="glass-card p-6 space-y-4">
        <h1 className="text-2xl font-bold text-dark-100">Verify OTP</h1>
        <p className="text-sm text-dark-400">Email: {email || 'Please reopen this page from registration/login flow.'}</p>
        <div>
          <label className="input-label">6-digit OTP</label>
          <input className="input-field" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} />
        </div>
        <button className="btn-primary w-full" disabled={verifyMutation.isPending || !email || code.length < 4} onClick={() => verifyMutation.mutate()}>
          {verifyMutation.isPending ? 'Verifying...' : 'Verify'}
        </button>
        <button className="btn-ghost w-full" disabled={resendMutation.isPending || !email} onClick={() => resendMutation.mutate()}>
          {resendMutation.isPending ? 'Resending...' : 'Resend OTP'}
        </button>
      </div>
    </div>
  )
}
