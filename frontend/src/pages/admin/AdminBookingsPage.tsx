import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../services/api'
import { Search, Filter, Download, ExternalLink, Ticket, User, Calendar, CreditCard } from 'lucide-react'
import { format } from 'date-fns'

export default function AdminBookingsPage() {
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: () => adminApi.getBookings({ limit: 100 }).then((r) => r.data?.data || []),
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Bookings</h1>
          <p className="text-dark-400">View and monitor all ticket bookings across the platform.</p>
        </div>
        <button className="btn-secondary">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input type="text" placeholder="Search by Ref or User..." className="input-field pl-10" />
        </div>
        <select className="input-field w-auto min-w-[150px]">
          <option value="">All Statuses</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="PENDING">Pending</option>
        </select>
        <button className="btn-secondary px-4">
          <Filter className="w-4 h-4" />
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-dark-700/60 text-dark-300">
              <tr>
                <th className="text-left p-4 font-medium uppercase tracking-wider">Booking Ref</th>
                <th className="text-left p-4 font-medium uppercase tracking-wider">User</th>
                <th className="text-left p-4 font-medium uppercase tracking-wider">Show Info</th>
                <th className="text-left p-4 font-medium uppercase tracking-wider">Status</th>
                <th className="text-right p-4 font-medium uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/50">
              {isLoading ? (
                [1,2,3].map(i => <tr key={i}><td colSpan={5} className="p-4"><div className="h-12 skeleton rounded-xl" /></td></tr>)
              ) : bookings?.map((b: any) => (
                <tr key={b.id} className="hover:bg-dark-700/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-brand-500/10 text-brand-400 rounded-lg"><Ticket className="w-4 h-4" /></div>
                      <span className="font-mono font-bold text-white">{b.bookingRef}</span>
                    </div>
                  </td>
                  <td className="p-4 text-dark-200">
                    <div className="flex items-center gap-2">
                       <User className="w-3 h-3 text-dark-400" />
                       <div>
                         <p className="font-medium">{b.user.name}</p>
                         <p className="text-[10px] text-dark-500 tracking-tight">{b.user.email}</p>
                       </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <p className="text-white font-bold">{b.show.movie.title}</p>
                      <div className="flex items-center gap-2 text-[10px] text-dark-400 uppercase">
                        <Calendar className="w-3 h-3" />
                        <span>{format(new Date(b.show.startTime), 'MMM dd')}</span>
                        <span className="w-1 h-1 rounded-full bg-dark-600" />
                        <span>{format(new Date(b.show.startTime), 'hh:mm a')}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      b.status === 'CONFIRMED' ? 'bg-green-500/10 text-green-400' : 
                      b.status === 'CANCELLED' ? 'bg-red-500/10 text-red-500' : 
                      'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-white">₹{b.totalAmount}</span>
                      <span className="text-[10px] text-dark-500 uppercase flex items-center gap-1">
                        <CreditCard className="w-2.5 h-2.5" />
                        {b.payment?.method || 'N/A'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
