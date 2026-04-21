import { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { showsApi, seatsApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const SEAT_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-dark-600 border-dark-500 hover:bg-dark-500 hover:border-brand-500 cursor-pointer text-dark-300',
  SELECTED:  'bg-brand-500 border-brand-400 text-white cursor-pointer ring-2 ring-brand-400/50',
  LOCKED:    'bg-yellow-500/20 border-yellow-500/40 text-yellow-600 cursor-not-allowed',
  BOOKED:    'bg-dark-700 border-dark-700 text-dark-600 cursor-not-allowed opacity-40',
}

const SEAT_TYPE_LABELS: Record<string, string> = {
  REGULAR: 'Regular', PREMIUM: 'Premium', RECLINER: 'Recliner',
  COUPLE: 'Couple', ACCESSIBLE: 'Accessible',
}

export default function SeatSelectionPage() {
  const { showId } = useParams<{ showId: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['seats', showId],
    queryFn: () => seatsApi.getByShow(showId!).then(r => r.data.data),
    enabled: !!showId,
    refetchInterval: 10000,
  })

  const lockMutation = useMutation({
    mutationFn: (seatIds: string[]) => seatsApi.lock({ showId: showId!, seatIds }),
    onSuccess: () => {
      toast.success(`${selectedSeats.length} seat(s) locked! Proceeding to checkout...`)
      navigate(`/book/${showId}/checkout`, {
        state: { seatIds: selectedSeats, showData: data }
      })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to lock seats. Please try again.')
      refetch()
      setSelectedSeats([])
    },
  })

  const seats    = data?.seats   || []
  const pricing  = data?.pricing || {}
  const show     = data?.show    || {}
  const screen   = data?.screen  || {}

  const seatsByRow = seats.reduce((acc: Record<string, any[]>, seat: any) => {
    if (!acc[seat.row]) acc[seat.row] = []
    acc[seat.row].push(seat)
    return acc
  }, {})

  const toggleSeat = useCallback((seat: any) => {
    if (seat.status === 'BOOKED' || seat.status === 'LOCKED') return
    setSelectedSeats(prev => {
      if (prev.includes(seat.id)) return prev.filter(id => id !== seat.id)
      if (prev.length >= 10) { toast.error('Max 10 seats per booking'); return prev }
      return [...prev, seat.id]
    })
  }, [])

  const selectedSeatData = seats.filter((s: any) => selectedSeats.includes(s.id))
  const totalPrice = selectedSeatData.reduce((sum: number, s: any) => sum + (pricing[s.type] || 0), 0)

  const handleProceed = () => {
    if (!isAuthenticated) {
      toast.error('Please login to book tickets')
      navigate('/auth/login')
      return
    }
    if (selectedSeats.length === 0) {
      toast.error('Please select at least one seat')
      return
    }
    lockMutation.mutate(selectedSeats)
  }

  if (isLoading) return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      <div className="page-container py-8 space-y-4 animate-fade-in flex-1">
        <div className="skeleton h-8 w-64 rounded-lg" />
        <div className="skeleton h-16 rounded-xl" />
        <div className="skeleton h-[480px] rounded-2xl" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">

      {/* ── Show info bar ───────────────────────────────────── */}
      <div className="page-container pt-6 pb-0">
        <div className="glass-card p-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <div>
            <span className="text-dark-500 mr-1.5">Screen:</span>
            <span className="text-dark-100 font-medium">{screen.name} · {screen.type}</span>
          </div>
          <div>
            <span className="text-dark-500 mr-1.5">Show:</span>
            <span className="text-dark-100 font-medium">
              {show.startTime ? format(new Date(show.startTime), 'hh:mm a, EEEE dd MMM') : '—'}
            </span>
          </div>
          <div>
            <span className="text-dark-500 mr-1.5">Format:</span>
            <span className="text-dark-100 font-medium">{show.format} · {show.language}</span>
          </div>
        </div>
      </div>

      {/* ── Main content (scrollable) ───────────────────────── */}
      <div className="flex-1 page-container py-8 pb-6">

        {/* Seat grid — centered block */}
        <div className="w-fit mx-auto">

          {/* Screen bar */}
          <div className="screen-top-inline mb-1" />
          <p className="text-center text-xs text-dark-500 uppercase tracking-widest mb-8">⬆ Screen this way</p>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-5 mb-8">
            {[
              { label: 'Available',  cls: 'bg-dark-600 border border-dark-500' },
              { label: 'Selected',   cls: 'bg-brand-500 border border-brand-400' },
              { label: 'Reserved',   cls: 'bg-yellow-500/20 border border-yellow-500/40' },
              { label: 'Booked',     cls: 'bg-dark-700 border border-dark-700 opacity-40' },
            ].map(({ label, cls }) => (
              <div key={label} className="flex items-center gap-2 text-xs text-dark-400">
                <div className={`w-5 h-5 rounded-sm ${cls}`} />
                {label}
              </div>
            ))}
          </div>

          {/* Seat rows */}
          <div className="space-y-2">
            {(Object.entries(seatsByRow) as [string, any[]][]).map(([row, rowSeats]) => {
              const rowType = rowSeats[0]?.type
              return (
                <div key={row} className="flex items-center gap-2">
                  <div className="w-7 text-xs text-dark-500 font-mono font-bold text-right flex-shrink-0">{row}</div>
                  <div className="flex items-center gap-1.5">
                    {rowSeats.map((seat: any) => (
                      <button
                        key={seat.id}
                        onClick={() => toggleSeat(seat)}
                        title={`${seat.seatCode} — ${SEAT_TYPE_LABELS[seat.type]} — ₹${pricing[seat.type] || 0}`}
                        className={`w-7 h-7 rounded text-xs font-mono border transition-all duration-150 flex items-center justify-center ${
                          SEAT_COLORS[selectedSeats.includes(seat.id) ? 'SELECTED' : seat.status]
                        }`}
                      >
                        {seat.number}
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-dark-500 ml-2 flex-shrink-0 w-14">
                    ₹{pricing[rowType] || 0}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Pricing table */}
        <div className="mt-10 glass-card p-4 max-w-sm mx-auto">
          <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-3">Price per seat</h3>
          <div className="space-y-2">
            {Object.entries(pricing).map(([type, price]: [string, any]) => (
              <div key={type} className="flex justify-between text-sm">
                <span className="text-dark-400">{SEAT_TYPE_LABELS[type] || type}</span>
                <span className="text-dark-200 font-semibold">₹{price}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── STICKY PROCEED BAR (always visible at the bottom) ── */}
      <div className="sticky bottom-0 left-0 right-0 z-40 border-t border-dark-700 bg-dark-800/95 backdrop-blur-md shadow-[0_-4px_24px_rgba(0,0,0,0.5)]">
        <div className="page-container py-4">
          <div className="max-w-3xl mx-auto flex items-center gap-4">

            {/* Selected seat info */}
            <div className="flex-1 min-w-0">
              {selectedSeats.length === 0 ? (
                <p className="text-sm text-dark-500">Select seats above to continue</p>
              ) : (
                <>
                  <p className="text-xs text-dark-400 mb-0.5">
                    {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''} selected:{' '}
                    <span className="text-dark-200 font-medium">
                      {selectedSeatData.map((s: any) => s.seatCode).join(', ')}
                    </span>
                  </p>
                  <p className="text-2xl font-bold text-white">
                    ₹{totalPrice.toLocaleString('en-IN')}
                  </p>
                </>
              )}
            </div>

            {/* Proceed button — always rendered, disabled when no seats */}
            <button
              id="proceed-to-pay"
              onClick={handleProceed}
              disabled={lockMutation.isPending}
              className={`flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-base transition-all duration-200 flex-shrink-0 ${
                selectedSeats.length === 0
                  ? 'bg-dark-700 text-dark-500 cursor-not-allowed border border-dark-600'
                  : 'bg-brand-500 hover:bg-brand-600 text-white shadow-glow hover:shadow-glow-lg active:scale-95'
              } disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              {lockMutation.isPending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Locking seats...
                </>
              ) : (
                <>
                  Proceed to Pay
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>

          </div>
        </div>
      </div>

    </div>
  )
}
