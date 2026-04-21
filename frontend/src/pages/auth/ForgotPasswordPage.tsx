import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { authApi } from '../../services/api'

type Step = 'request' | 'reset' | 'done'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('request')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPass, setShowPass] = useState(false)

  const requestMutation = useMutation({
    mutationFn: () => authApi.forgotPassword({ email }),
    onSuccess: () => {
      toast.success('OTP sent! Check your email inbox. 📧')
      setStep('reset')
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to send reset OTP'),
  })

  const resetMutation = useMutation({
    mutationFn: () => authApi.resetPassword({ email, code: otp, newPassword }),
    onSuccess: () => {
      toast.success('Password reset successfully! Please log in. 🎉')
      setStep('done')
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Reset failed. Check your OTP.'),
  })

  const passwordOk = newPassword.length >= 8 && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(newPassword)

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 px-4 py-12">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Back to login */}
        <Link to="/auth/login" className="flex items-center gap-2 text-sm text-dark-500 hover:text-dark-300 transition-colors mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to login
        </Link>

        <div className="bg-dark-800/80 backdrop-blur-sm border border-dark-700 rounded-2xl p-8 shadow-2xl">

          {/* ── Step: Done ── */}
          {step === 'done' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-500/10 border-2 border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-dark-100 mb-2">Password changed!</h2>
              <p className="text-dark-400 text-sm mb-8">Your password has been reset successfully. You can now sign in with your new password.</p>
              <button
                onClick={() => navigate('/auth/login')}
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 rounded-xl transition-all"
              >
                Go to Login
              </button>
            </div>
          )}

          {/* ── Step: Request OTP ── */}
          {step === 'request' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-brand-500/10 border-2 border-brand-500/30 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-dark-100 text-center mb-1">Forgot password?</h2>
              <p className="text-sm text-dark-400 text-center mb-8">
                Enter your registered email and we'll send you an OTP to reset your password.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">Email address</label>
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-3 text-dark-100 placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && email) requestMutation.mutate() }}
                  />
                </div>
                <button
                  id="forgot-send-otp"
                  onClick={() => requestMutation.mutate()}
                  disabled={!email || requestMutation.isPending}
                  className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-500/30"
                >
                  {requestMutation.isPending ? (
                    <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Sending OTP...</>
                  ) : 'Send Reset OTP'}
                </button>
              </div>
            </>
          )}

          {/* ── Step: Enter OTP + new password ── */}
          {step === 'reset' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-brand-500/10 border-2 border-brand-500/30 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-dark-100 text-center mb-1">Set new password</h2>
              <p className="text-sm text-dark-400 text-center mb-1">Enter the OTP sent to</p>
              <p className="text-sm font-semibold text-brand-400 text-center mb-7 truncate">{email}</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">OTP Code</label>
                  <input
                    id="reset-otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="######"
                    className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-3 text-dark-100 placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors text-center text-lg tracking-[0.5em] font-mono"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      id="reset-password"
                      type={showPass ? 'text' : 'password'}
                      placeholder="Min 8 chars with upper, lower, number, special"
                      className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-3 pr-11 text-dark-100 placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
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
                  {newPassword && !passwordOk && (
                    <p className="text-xs text-red-400 mt-1">Must have uppercase, lowercase, number & special char (@$!%*?&)</p>
                  )}
                </div>

                <button
                  id="reset-submit"
                  onClick={() => resetMutation.mutate()}
                  disabled={otp.length < 4 || !passwordOk || resetMutation.isPending}
                  className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-500/30"
                >
                  {resetMutation.isPending ? (
                    <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Resetting password...</>
                  ) : 'Reset Password'}
                </button>

                <button
                  type="button"
                  className="w-full text-sm text-dark-500 hover:text-dark-300 transition-colors"
                  onClick={() => setStep('request')}
                >
                  ← Re-enter email address
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
