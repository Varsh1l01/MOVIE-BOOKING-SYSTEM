import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { authApi } from '../../services/api'
import { useAuthStore } from '../../store/authStore'

const OTP_LENGTH = 6
const RESEND_COOLDOWN = 60 // seconds

export default function OtpVerifyPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const email = searchParams.get('email') || ''
  const purpose = searchParams.get('purpose') || 'EMAIL_VERIFY'

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [cooldown, setCooldown] = useState(0)
  const refs = useRef<(HTMLInputElement | null)[]>([])

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => setCooldown((c) => c - 1), 1000)
    return () => clearInterval(id)
  }, [cooldown])

  const code = digits.join('')

  const verifyMutation = useMutation({
    mutationFn: () => authApi.verifyOtp({ email, code, purpose }),
    onSuccess: (res) => {
      const payload = res.data?.data
      toast.success('Email verified! You can now log in. ✅')
      if (payload?.user && payload?.accessToken) {
        setAuth(payload.user, payload.accessToken)
        navigate('/')
      } else {
        navigate('/auth/login')
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Invalid OTP. Please try again.')
      setDigits(Array(OTP_LENGTH).fill(''))
      refs.current[0]?.focus()
    },
  })

  const resendMutation = useMutation({
    mutationFn: () => authApi.sendOtp({ email, purpose }),
    onSuccess: () => {
      toast.success('New OTP sent to your email 📧')
      setCooldown(RESEND_COOLDOWN)
      setDigits(Array(OTP_LENGTH).fill(''))
      refs.current[0]?.focus()
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to resend OTP'),
  })

  const handleDigit = useCallback((idx: number, value: string) => {
    // Handle paste
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, '').slice(0, OTP_LENGTH)
      const next = Array(OTP_LENGTH).fill('')
      pasted.split('').forEach((ch, i) => { next[i] = ch })
      setDigits(next)
      refs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus()
      return
    }
    if (!/^\d?$/.test(value)) return
    const next = [...digits]
    next[idx] = value
    setDigits(next)
    if (value && idx < OTP_LENGTH - 1) refs.current[idx + 1]?.focus()
  }, [digits])

  const handleKey = useCallback((idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      refs.current[idx - 1]?.focus()
    }
  }, [digits])

  const purposeLabel = {
    EMAIL_VERIFY: 'Email Verification',
    PHONE_VERIFY: 'Phone Verification',
    PASSWORD_RESET: 'Password Reset',
    LOGIN: 'One-Time Login',
  }[purpose] || 'Verification'

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 px-4 py-12">
      {/* Ambient background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-dark-800/80 backdrop-blur-sm border border-dark-700 rounded-2xl p-8 shadow-2xl">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-brand-500/10 border-2 border-brand-500/30 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-dark-100 text-center mb-1">{purposeLabel}</h2>
          <p className="text-sm text-dark-400 text-center mb-1">
            We sent a 6-digit code to
          </p>
          <p className="text-sm font-semibold text-brand-400 text-center mb-8 truncate">
            {email || 'your email address'}
          </p>

          {/* OTP boxes */}
          <div className="flex gap-3 justify-center mb-6" role="group" aria-label="OTP input">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { refs.current[i] = el }}
                id={`otp-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={d}
                aria-label={`Digit ${i + 1}`}
                onChange={(e) => handleDigit(i, e.target.value)}
                onKeyDown={(e) => handleKey(i, e)}
                onFocus={(e) => e.target.select()}
                className={`w-11 h-12 text-center text-xl font-bold rounded-xl border-2 bg-dark-900 text-dark-100 focus:outline-none transition-all duration-150 ${
                  d
                    ? 'border-brand-500 bg-brand-500/10 text-brand-300'
                    : 'border-dark-600 focus:border-brand-500'
                }`}
              />
            ))}
          </div>

          {/* Verify button */}
          <button
            id="otp-verify-btn"
            onClick={() => verifyMutation.mutate()}
            disabled={code.length < OTP_LENGTH || verifyMutation.isPending}
            className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-brand-500/30 mb-4"
          >
            {verifyMutation.isPending ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Verifying...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Verify OTP
              </>
            )}
          </button>

          {/* Resend */}
          <div className="text-center">
            {cooldown > 0 ? (
              <p className="text-sm text-dark-500">
                Resend OTP in <span className="text-brand-400 font-medium tabular-nums">{cooldown}s</span>
              </p>
            ) : (
              <button
                id="otp-resend-btn"
                type="button"
                onClick={() => resendMutation.mutate()}
                disabled={resendMutation.isPending || !email}
                className="text-sm text-brand-400 hover:text-brand-300 disabled:opacity-50 font-medium transition-colors"
              >
                {resendMutation.isPending ? 'Sending...' : "Didn't receive it? Resend OTP"}
              </button>
            )}
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <Link to="/auth/login" className="text-sm text-dark-500 hover:text-dark-300 transition-colors flex items-center justify-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
