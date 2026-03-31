import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { showsApi, seatsApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { Clock, Info, MoveRight } from 'lucide-react'
import { format } from 'date-fns'

const SEAT_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-dark-600 border-dark-500 hover:bg-dark-500 hover:border-dark-400 cursor-pointer text-dark-300',
  SELECTED: 'bg-brand-500 border-brand-500 text-white cursor-pointer shadow-glow',
  LOCKED: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-600 cursor-not-allowed',
  BOOKED: 'bg-dark-700 border-dark-700 text-dark-600 cursor-not-allowed opacity-50',
}

const SEAT_TYPE_LABELS: Record<string, string> = {
  REGULAR: 'Regular', PREMIUM: 'Premium', RECLINER: 'Recliner',
  COUPLE: 'Couple', ACCESSIBLE: 'Accessible',
}

function CountdownTimer({ seconds }: { seconds: number }) {
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => {
    if (remaining <= 0) return
    const interval = setInterval(() => setRemaining(r => r - 1), 1000)
    return () => clearInterval(interval)
  }, [remaining])

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const isLow = remaining < 60

  return (
    <div className={`flex items-center gap-2 text-sm font-medium ${isLow ? 'text-red-400 animate-pulse' : 'text-yellow-400'}`}>
      <Clock size={14} />
      <span>Seat reserved for: {mins}:{secs.toString().padStart(2, '0')}</span>
    </div>
  )
}

export default function SeatSelectionPage() {
  const { showId } = useParams<{ showId: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [lockedAt, setLockedAt] = useState<number | null>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['seats', showId],
    queryFn: () => seatsApi.getByShow(showId!).then(r => r.data.data),
    enabled: !!showId,
    refetchInterval: 10000, // refresh every 10s to update lock status
  })

  const lockMutation = useMutation({
    mutationFn: (seatIds: string[]) => seatsApi.lock({ showId: showId!, seatIds }),
    onSuccess: () => {
      setLockedAt(Date.now())
      toast.success(`${selectedSeats.length} seat(s) locked for 5 minutes!`)
      navigate(`/book/${showId}/checkout`, {
        state: { seatIds: selectedSeats, showData: data }
      })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to lock seats. They may have been taken.')
      refetch()
      setSelectedSeats([])
    },
  })

  const seats = data?.seats || []
  const pricing = data?.pricing || {}
  const show = data?.show || {}
  const screen = data?.screen || {}

  // Group seats by row
  const seatsByRow = seats.reduce((acc: Record<string, any[]>, seat: any) => {
    if (!acc[seat.row]) acc[seat.row] = []
    acc[seat.row].push(seat)
    return acc
  }, {})

  const toggleSeat = (seat: any) => {
    if (seat.status === 'BOOKED' || seat.status === 'LOCKED') return
    if (selectedSeats.includes(seat.id)) {
      setSelectedSeats(prev => prev.filter(id => id !== seat.id))
    } else {
      if (selectedSeats.length >= 10) { toast.error('Max 10 seats per booking'); return }
      setSelectedSeats(prev => [...prev, seat.id])
    }
  }

  const selectedSeatData = seats.filter((s: any) => selectedSeats.includes(s.id))
  const totalPrice = selectedSeatData.reduce((sum: number, s: any) => sum + (pricing[s.type] || 0), 0)

  const handleProceed = () => {
    if (!isAuthenticated) { toast.error('Please login to book tickets'); navigate('/auth/login'); return }
    if (selectedSeats.length === 0) { toast.error('Please select at least one seat'); return }
    lockMutation.mutate(selectedSeats)
  }

  if (isLoading) return (
    <div className="page-container py-8 space-y-4 animate-fade-in">
      <div className="skeleton h-8 w-48 rounded" />
      <div className="skeleton h-96 rounded-2xl" />
    </div>
  )

  return (
    <div className="animate-fade-in page-container py-8">
      {/* Show info */}
      <div className="glass-card p-4 mb-6 flex flex-wrap items-center gap-4 text-sm">
        <div>
          <span className="text-dark-400 mr-2">Screen:</span>
          <span className="text-dark-100 font-medium">{screen.name} ({screen.type})</span>
        </div>
        <div>
          <span className="text-dark-400 mr-2">Show:</span>
          <span className="text-dark-100 font-medium">{show.startTime ? format(new Date(show.startTime), 'hh:mm a, EEEE, dd MMM') : ''}</span>
        </div>
        <div>
          <span className="text-dark-400 mr-2">Format:</span>
          <span className="text-dark-100 font-medium">{show.format} • {show.language}</span>
        </div>
      </div>

      {/* Screen indicator */}
      <div className="text-center mb-10">
        <div className="screen-top" />
        <span className="text-xs text-dark-500 uppercase tracking-widest">Screen This Way</span>
      </div>

      {/* Seat Legend */}
      <div className="flex flex-wrap justify-center gap-5 mb-8">
        {[
          { label: 'Available', cls: 'bg-dark-600 border border-dark-500' },
          { label: 'Selected', cls: 'bg-brand-500 border border-brand-500' },
          { label: 'Reserved', cls: 'bg-yellow-500/20 border border-yellow-500/40' },
          { label: 'Booked', cls: 'bg-dark-700 border border-dark-700 opacity-50' },
        ].map(({ label, cls }) => (
          <div key={label} className="flex items-center gap-2 text-xs text-dark-400">
            <div className={`w-5 h-5 rounded-sm ${cls}`} />
            {label}
          </div>
        ))}
      </div>

      {/* Seat Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-max mx-auto space-y-2 px-4">
          {/* Price legend by row */}
          {(Object.entries(seatsByRow) as [string, any[]][]).map(([row, rowSeats]) => {
            const rowType = rowSeats[0]?.type
            return (
              <div key={row} className="flex items-center gap-2">
                <div className="w-8 text-xs text-dark-500 font-mono font-bold text-right flex-shrink-0">{row}</div>
                <div className="flex items-center gap-1.5">
                  {rowSeats.map((seat: any) => (
                    <button
                      key={seat.id}
                      onClick={() => toggleSeat(seat)}
                      title={`${seat.seatCode} — ${SEAT_TYPE_LABELS[seat.type]} — ₹${pricing[seat.type] || 0}`}
                      className={`w-7 h-7 rounded-sm text-xs font-mono border transition-all duration-150 flex items-center justify-center ${SEAT_COLORS[selectedSeats.includes(seat.id) ? 'SELECTED' : seat.status]}`}
                    >
                      {seat.number}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-dark-500 ml-2 flex-shrink-0">
                  ₹{pricing[rowType] || 0}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pricing breakdown */}
      <div className="mt-8 glass-card p-4 max-w-xl mx-auto">
        <h3 className="font-semibold text-dark-200 mb-3 text-sm">Pricing (per seat type)</h3>
        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          {Object.entries(pricing).map(([type, price]: [string, any]) => (
            <div key={type} className="flex justify-between">
              <span className="text-dark-400">{SEAT_TYPE_LABELS[type] || type}</span>
              <span className="text-dark-200 font-medium">₹{price}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      {selectedSeats.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-dark-800/95 backdrop-blur-md border-t border-dark-700 px-4 py-4 animate-slide-up">
          <div className="max-w-2xl mx-auto flex items-center gap-4">
            <div className="flex-1">
              <div className="text-sm text-dark-300 mb-1">
                {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''} selected:{' '}
                <span className="text-dark-100 font-medium">{selectedSeatData.map((s: any) => s.seatCode).join(', ')}</span>
              </div>
              <div className="text-xl font-bold text-white">₹{totalPrice.toLocaleString('en-IN')}</div>
            </div>
            <button
              onClick={handleProceed}
              disabled={lockMutation.isPending}
              className="btn-primary text-base px-6 py-3 disabled:opacity-70"
            >
              {lockMutation.isPending ? 'Locking...' : 'Proceed to Pay'}
              {!lockMutation.isPending && <MoveRight size={18} />}
            </button>
          </div>
        </div>
      )}

      {/* Bottom spacer when bar is visible */}
      {selectedSeats.length > 0 && <div className="h-24" />}
    </div>
  )
}
