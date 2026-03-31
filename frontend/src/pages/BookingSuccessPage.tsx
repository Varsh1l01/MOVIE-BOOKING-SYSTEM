import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { bookingsApi } from '../services/api'
import { format } from 'date-fns'
import { CheckCircle, Download, Home, Ticket, Calendar, MapPin, Film, Users } from 'lucide-react'

export default function BookingSuccessPage() {
  const { bookingRef } = useParams<{ bookingRef: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ['booking', bookingRef],
    queryFn: () => bookingsApi.getByRef(bookingRef!).then(r => r.data.data),
    enabled: !!bookingRef,
  })

  const booking = data

  if (isLoading) return (
    <div className="page-container py-16 flex flex-col items-center gap-4">
      <div className="w-20 h-20 skeleton rounded-full" />
      <div className="skeleton h-6 w-48 rounded" />
      <div className="glass-card p-8 w-full max-w-lg skeleton h-64 rounded-2xl" />
    </div>
  )

  if (!booking) return (
    <div className="page-container py-16 text-center">
      <h2 className="text-xl font-bold text-dark-200">Booking not found</h2>
      <Link to="/" className="btn-primary mt-4 inline-flex">Go Home</Link>
    </div>
  )

  const show = booking.show
  const seats = booking.bookingItems?.map((bi: any) => bi.seatCode) || []

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="animate-fade-in page-container py-12 max-w-xl mx-auto">
      {/* Success icon */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/50 flex items-center justify-center mx-auto mb-4 animate-scale-in">
          <CheckCircle size={40} className="text-green-400" />
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-2">Booking Confirmed! 🎉</h1>
        <p className="text-dark-400">Your tickets have been booked successfully. Check your email for details.</p>
      </div>

      {/* Ticket Card */}
      <div className="relative glass-card overflow-hidden border border-dark-600 mb-6">
        {/* Movie banner */}
        {show?.movie?.posterUrl && (
          <div className="h-32 overflow-hidden">
            <img src={show.movie.posterUrl} alt="" className="w-full h-full object-cover opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-b from-dark-900/20 to-dark-800" />
          </div>
        )}

        {/* Ticket details */}
        <div className="p-6 space-y-4">
          {/* Booking Ref */}
          <div className="flex items-center justify-between bg-dark-700/50 rounded-xl p-4">
            <div>
              <p className="text-xs text-dark-400 uppercase tracking-wide mb-1">Booking Reference</p>
              <p className="text-xl font-mono font-bold text-brand-400">{booking.bookingRef}</p>
            </div>
            <span className="badge badge-green text-xs">● Confirmed</span>
          </div>

          {/* Show details grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-dark-700/30 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Film size={12} className="text-brand-500" />
                <span className="text-xs text-dark-400 uppercase">Movie</span>
              </div>
              <p className="text-sm font-semibold text-dark-100">{show?.movie?.title}</p>
            </div>
            <div className="bg-dark-700/30 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={12} className="text-brand-500" />
                <span className="text-xs text-dark-400 uppercase">Show Time</span>
              </div>
              <p className="text-sm font-semibold text-dark-100">
                {show?.startTime ? format(new Date(show.startTime), 'hh:mm a') : '—'}
              </p>
              <p className="text-xs text-dark-400">
                {show?.startTime ? format(new Date(show.startTime), 'EEE, dd MMM yyyy') : ''}
              </p>
            </div>
            <div className="bg-dark-700/30 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={12} className="text-brand-500" />
                <span className="text-xs text-dark-400 uppercase">Theatre</span>
              </div>
              <p className="text-sm font-semibold text-dark-100">{show?.screen?.theatre?.name}</p>
              <p className="text-xs text-dark-400">{show?.screen?.name}</p>
            </div>
            <div className="bg-dark-700/30 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Users size={12} className="text-brand-500" />
                <span className="text-xs text-dark-400 uppercase">Seats</span>
              </div>
              <p className="text-sm font-semibold text-dark-100">{seats.join(', ')}</p>
              <p className="text-xs text-dark-400">{booking.totalSeats} ticket{booking.totalSeats > 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Dashed divider */}
          <div className="border-t-2 border-dashed border-dark-600 relative">
            <div className="absolute -left-6 -top-4 w-8 h-8 rounded-full bg-dark-900 border border-dark-700" />
            <div className="absolute -right-6 -top-4 w-8 h-8 rounded-full bg-dark-900 border border-dark-700" />
          </div>

          {/* Amount */}
          <div className="flex items-center justify-between">
            <div className="text-dark-400 text-sm">Total Paid</div>
            <div className="text-xl font-bold text-white">₹{booking.totalAmount?.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button onClick={handlePrint} className="btn-secondary flex-1 py-3">
          <Download size={16} /> Download Ticket
        </button>
        <Link to="/profile?tab=bookings" className="btn-secondary flex-1 py-3 text-center">
          <Ticket size={16} /> My Bookings
        </Link>
      </div>

      <Link to="/" className="mt-4 w-full btn-ghost text-center flex items-center justify-center gap-2">
        <Home size={16} /> Back to Home
      </Link>

      {/* Enjoy message */}
      <div className="text-center mt-6 p-4 bg-brand-500/10 border border-brand-500/20 rounded-xl">
        <p className="text-brand-400 font-medium">🍿 Enjoy your movie!</p>
        <p className="text-dark-500 text-xs mt-1">Please show this ticket or your email confirmation at the theatre.</p>
      </div>
    </div>
  )
}
