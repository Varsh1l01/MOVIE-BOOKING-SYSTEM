import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi, bookingsApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { User, Ticket, Settings, MapPin, Mail, Phone, Edit2, X, CheckCircle, Clock, XCircle } from 'lucide-react'

const BOOKING_STATUS_MAP: Record<string, { label: string; cls: string }> = {
  CONFIRMED: { label: 'Confirmed', cls: 'badge-green' },
  PENDING: { label: 'Pending', cls: 'badge-yellow' },
  CANCELLED: { label: 'Cancelled', cls: 'badge-red' },
  REFUNDED: { label: 'Refunded', cls: 'badge-blue' },
  EXPIRED: { label: 'Expired', cls: 'badge-gray' },
}

function ProfileTab({ user, onUpdate }: { user: any; onUpdate: () => void }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: user?.name || '', city: user?.city || '' })

  const mutation = useMutation({
    mutationFn: () => authApi.updateMe(form),
    onSuccess: () => { toast.success('Profile updated!'); setEditing(false); onUpdate() },
    onError: () => toast.error('Failed to update profile'),
  })

  return (
    <div className="space-y-5">
      <div className="glass-card p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-2xl font-bold shadow-glow">
              {user?.name?.[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-dark-100">{user?.name}</h2>
              <p className="text-dark-400 text-sm">{user?.role}</p>
              {user?.isVerified ? (
                <span className="badge badge-green text-xs mt-1">✓ Verified</span>
              ) : (
                <span className="badge badge-yellow text-xs mt-1">⚠ Unverified</span>
              )}
            </div>
          </div>
          <button onClick={() => setEditing(!editing)} className="btn-ghost text-sm">
            {editing ? <X size={16} /> : <Edit2 size={16} />}
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="input-label">Full Name</label>
              <input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="input-label">City</label>
              <input className="input-field" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Mumbai, Delhi, Bangalore..." />
            </div>
            <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="btn-primary">
              {mutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: Mail, label: 'Email', value: user?.email },
              { icon: Phone, label: 'Phone', value: user?.phone },
              { icon: MapPin, label: 'City', value: user?.city || 'Not set' },
              { icon: User, label: 'Member Since', value: user?.createdAt ? format(new Date(user.createdAt), 'MMMM yyyy') : '—' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 p-3 bg-dark-700/30 rounded-xl">
                <Icon size={16} className="text-brand-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-dark-400">{label}</p>
                  <p className="text-sm text-dark-100 font-medium">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function BookingsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => bookingsApi.getMy({ limit: 20 }).then(r => r.data),
  })

  const cancelMutation = useMutation({
    mutationFn: (ref: string) => bookingsApi.cancel(ref),
    onSuccess: () => toast.success('Booking cancelled. Refund will be processed.'),
    onError: (err: any) => toast.error(err.response?.data?.message || 'Cancellation failed'),
  })

  const bookings = data?.data || []

  if (isLoading) return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}
    </div>
  )

  if (!bookings.length) return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">🎫</div>
      <h3 className="text-xl font-semibold text-dark-300 mb-2">No bookings yet</h3>
      <p className="text-dark-500 mb-4">Your ticket history will appear here</p>
      <Link to="/" className="btn-primary">Browse Movies</Link>
    </div>
  )

  return (
    <div className="space-y-4">
      {bookings.map((booking: any) => {
        const statusInfo = BOOKING_STATUS_MAP[booking.status] || { label: booking.status, cls: 'badge-gray' }
        const show = booking.show
        return (
          <div key={booking.id} className="glass-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-4">
                {show?.movie?.posterUrl && (
                  <img src={show.movie.posterUrl} className="w-14 h-20 object-cover rounded-lg border border-dark-700 flex-shrink-0" alt="" />
                )}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge ${statusInfo.cls} text-xs`}>{statusInfo.label}</span>
                    <span className="text-xs font-mono text-dark-400">{booking.bookingRef}</span>
                  </div>
                  <h3 className="font-semibold text-dark-100 mb-1">{show?.movie?.title}</h3>
                  <p className="text-sm text-dark-400">{show?.screen?.theatre?.name}, {show?.screen?.theatre?.city}</p>
                  <p className="text-sm text-dark-400">
                    {show?.startTime ? format(new Date(show.startTime), 'hh:mm a, EEE dd MMM yyyy') : ''}
                  </p>
                  <p className="text-sm text-dark-300 mt-1">
                    {booking.bookingItems?.map((bi: any) => bi.seatCode).join(', ')}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-bold text-white">₹{booking.totalAmount}</p>
                {booking.status === 'CONFIRMED' && (
                  <button
                    onClick={() => cancelMutation.mutate(booking.bookingRef)}
                    disabled={cancelMutation.isPending}
                    className="mt-2 text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function ProfilePage() {
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile')
  const queryClient = useQueryClient()

  const { data: userData, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.getMe().then(r => r.data.data),
  })

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'bookings', label: 'My Bookings', icon: Ticket },
  ]

  return (
    <div className="animate-fade-in page-container py-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-dark-100 mb-6">My Account</h1>

      <div className="flex gap-1 mb-6 bg-dark-800 p-1 rounded-xl border border-dark-700 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === id ? 'bg-brand-500 text-white shadow-glow' : 'text-dark-300 hover:text-white'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="skeleton h-48 rounded-2xl" />
          <div className="skeleton h-32 rounded-2xl" />
        </div>
      ) : (
        <>
          {activeTab === 'profile' && <ProfileTab user={userData} onUpdate={() => queryClient.invalidateQueries({ queryKey: ['me'] })} />}
          {activeTab === 'bookings' && <BookingsTab />}
        </>
      )}
    </div>
  )
}
