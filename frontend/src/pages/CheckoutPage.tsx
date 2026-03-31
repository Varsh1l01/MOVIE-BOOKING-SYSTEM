import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { showsApi, bookingsApi, paymentsApi, couponsApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { Tag, CreditCard, Shield, AlertCircle, Clock, CheckCircle, ChevronRight } from 'lucide-react'

const PAYMENT_METHODS = [
  { id: 'UPI', label: 'UPI', icon: '📱', desc: 'Pay via PhonePe, GPay, Paytm' },
  { id: 'CARD', label: 'Credit / Debit Card', icon: '💳', desc: 'Visa, Mastercard, RuPay' },
  { id: 'NET_BANKING', label: 'Net Banking', icon: '🏦', desc: 'All major banks supported' },
  { id: 'WALLET', label: 'Wallet', icon: '👛', desc: 'Paytm, Amazon Pay, Mobikwik' },
]

export default function CheckoutPage() {
  const { showId } = useParams<{ showId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const { seatIds, showData } = (location.state as any) || {}
  const [paymentMethod, setPaymentMethod] = useState('MOCK')
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [couponError, setCouponError] = useState('')
  const [timeLeft, setTimeLeft] = useState(300)

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) { toast.error('Session expired! Redirecting...'); navigate(-2); return }
    const t = setInterval(() => setTimeLeft(r => r - 1), 1000)
    return () => clearInterval(t)
  }, [timeLeft])

  const { data: show } = useQuery({
    queryKey: ['show', showId],
    queryFn: () => showsApi.getById(showId!).then(r => r.data.data),
    enabled: !!showId,
  })

  // Pricing
  const pricing = showData?.pricing || {}
  const seats = showData?.seats?.filter((s: any) => seatIds?.includes(s.id)) || []
  const subtotal = seats.reduce((sum: number, s: any) => sum + (pricing[s.type] || 0), 0)
  const convenienceFee = Math.round(subtotal * 0.02)
  const discount = appliedCoupon?.discount || 0
  const total = subtotal + convenienceFee - discount

  const validateCouponMutation = useMutation({
    mutationFn: () => couponsApi.validate({ code: couponCode, orderAmount: subtotal }),
    onSuccess: (res) => {
      setAppliedCoupon(res.data.data)
      setCouponError('')
      toast.success(`Coupon applied! ₹${res.data.data.discount} off`)
    },
    onError: (err: any) => {
      setCouponError(err.response?.data?.message || 'Invalid coupon')
      setAppliedCoupon(null)
    },
  })

  const bookingMutation = useMutation({
    mutationFn: () => bookingsApi.create({ showId, seatIds, couponCode: appliedCoupon ? couponCode : undefined }),
    onError: (err: any) => toast.error(err.response?.data?.message || 'Booking failed'),
  })

  const paymentMutation = useMutation({
    mutationFn: (bookingId: string) => paymentsApi.initiate({ bookingId, method: paymentMethod }),
    onError: (err: any) => toast.error(err.response?.data?.message || 'Payment init failed'),
  })

  const confirmMutation = useMutation({
    mutationFn: (paymentId: string) => paymentsApi.confirm({ paymentId, method: paymentMethod }),
    onSuccess: (res) => {
      const ref = res.data.data.bookingRef
      toast.success('🎉 Booking Confirmed!')
      navigate(`/booking/${ref}/success`)
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Payment failed'),
  })

  const handlePay = async () => {
    if (!seatIds?.length) { toast.error('No seats selected'); return }
    try {
      const bookingRes = await bookingMutation.mutateAsync()
      const booking = bookingRes.data.data
      const payRes = await paymentMutation.mutateAsync(booking.id)
      const paymentId = payRes.data.data.paymentId
      await confirmMutation.mutateAsync(paymentId)
    } catch {
      // errors handled in onError
    }
  }

  const isProcessing = bookingMutation.isPending || paymentMutation.isPending || confirmMutation.isPending
  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60

  if (!seatIds?.length) {
    return (
      <div className="page-container py-16 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-dark-200 mb-3">No seats selected</h2>
        <button onClick={() => navigate(-1)} className="btn-primary">Go Back</button>
      </div>
    )
  }

  return (
    <div className="animate-fade-in page-container py-8 max-w-4xl">
      {/* Session timer */}
      <div className={`flex items-center gap-2 mb-6 px-4 py-3 rounded-xl text-sm font-medium ${timeLeft < 60 ? 'bg-red-500/10 border border-red-500/30 text-red-400' : 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'}`}>
        <Clock size={16} />
        Seats reserved for: <strong>{mins}:{secs.toString().padStart(2, '0')}</strong>
        <span className="text-dark-500 ml-1">— Complete payment before timer expires</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Payment */}
        <div className="lg:col-span-3 space-y-5">
          {/* Coupon */}
          <div className="glass-card p-5">
            <h3 className="font-semibold text-dark-100 mb-3 flex items-center gap-2">
              <Tag size={16} className="text-brand-500" /> Apply Coupon
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); setAppliedCoupon(null) }}
                className="input-field flex-1 text-sm py-2.5"
              />
              <button
                onClick={() => validateCouponMutation.mutate()}
                disabled={!couponCode || validateCouponMutation.isPending}
                className="btn-outline text-sm px-4 py-2.5 whitespace-nowrap"
              >
                {validateCouponMutation.isPending ? '...' : 'Apply'}
              </button>
            </div>
            {couponError && (
              <p className="text-red-400 text-xs mt-2 flex items-center gap-1"><AlertCircle size={12} />{couponError}</p>
            )}
            {appliedCoupon && (
              <div className="mt-2 flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle size={14} /> Coupon applied — ₹{appliedCoupon.discount} off!
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {['FIRST50', 'FLAT100', 'WEEKEND20'].map(code => (
                <button
                  key={code}
                  onClick={() => setCouponCode(code)}
                  className="text-xs px-2.5 py-1 rounded-full bg-dark-700 text-dark-300 hover:text-white hover:bg-dark-600 border border-dark-600 transition-all font-mono"
                >
                  {code}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div className="glass-card p-5">
            <h3 className="font-semibold text-dark-100 mb-4 flex items-center gap-2">
              <CreditCard size={16} className="text-brand-500" /> Payment Method
            </h3>
            <div className="space-y-2">
              {PAYMENT_METHODS.map(pm => (
                <label
                  key={pm.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                    paymentMethod === pm.id
                      ? 'border-brand-500/60 bg-brand-500/10'
                      : 'border-dark-700 hover:border-dark-600 bg-dark-800'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={pm.id}
                    checked={paymentMethod === pm.id}
                    onChange={() => setPaymentMethod(pm.id)}
                    className="accent-brand-500"
                  />
                  <span className="text-xl">{pm.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-dark-100">{pm.label}</div>
                    <div className="text-xs text-dark-400">{pm.desc}</div>
                  </div>
                </label>
              ))}
              {/* Mock option for dev */}
              <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${paymentMethod === 'MOCK' ? 'border-brand-500/60 bg-brand-500/10' : 'border-dark-700 hover:border-dark-600 bg-dark-800'}`}>
                <input type="radio" name="payment" value="MOCK" checked={paymentMethod === 'MOCK'} onChange={() => setPaymentMethod('MOCK')} className="accent-brand-500" />
                <span className="text-xl">⚡</span>
                <div>
                  <div className="text-sm font-medium text-dark-100">Mock Pay (Dev)</div>
                  <div className="text-xs text-dark-400">Instant success — for testing only</div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-dark-500">
            <Shield size={14} className="text-green-400" />
            Your payment is secured with 256-bit SSL encryption
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-2">
          <div className="glass-card p-5 sticky top-24">
            <h3 className="font-semibold text-dark-100 mb-4">Order Summary</h3>

            {show && (
              <div className="bg-dark-700/50 rounded-xl p-4 mb-4 text-sm space-y-1">
                <p className="font-semibold text-dark-100">{show.movie?.title}</p>
                <p className="text-dark-400">{show.screen?.theatre?.name}</p>
                <p className="text-dark-400">{show.startTime ? format(new Date(show.startTime), 'hh:mm a, EEE dd MMM') : ''}</p>
                <p className="text-dark-400">{show.format} • {show.language}</p>
                <div className="pt-2 border-t border-dark-600">
                  <span className="text-dark-400">Seats: </span>
                  <span className="text-dark-200 font-medium">{seats.map((s: any) => s.seatCode).join(', ')}</span>
                </div>
              </div>
            )}

            <div className="space-y-3 text-sm border-t border-dark-700 pt-4">
              <div className="flex justify-between text-dark-300">
                <span>{seats.length} Ticket{seats.length > 1 ? 's' : ''}</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-dark-300">
                <span>Convenience Fee</span>
                <span>₹{convenienceFee}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Coupon Discount</span>
                  <span>-₹{discount.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between text-white font-bold text-base pt-2 border-t border-dark-700">
                <span>Total Payable</span>
                <span>₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              onClick={handlePay}
              disabled={isProcessing}
              className="btn-primary w-full mt-5 py-3.5 text-base disabled:opacity-70 relative overflow-hidden"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {bookingMutation.isPending ? 'Creating booking...' : paymentMutation.isPending ? 'Initiating payment...' : 'Processing...'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Pay ₹{total.toLocaleString('en-IN')} <ChevronRight size={18} />
                </span>
              )}
            </button>

            <p className="text-xs text-dark-500 text-center mt-3">
              By proceeding you agree to our Terms & Conditions
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
