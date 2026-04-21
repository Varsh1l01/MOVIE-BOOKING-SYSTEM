import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../services/api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Users, Film, Ticket, IndianRupee, RefreshCw, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function AdminDashboardPage() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.getDashboard().then((r) => r.data?.data),
  })

  const syncMutation = useMutation({
    mutationFn: adminApi.syncMovies,
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Movies synced successfully')
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['movies'] })
    },
    onError: () => toast.error('Failed to sync movies. Check TMDB API key.'),
  })

  if (isLoading) return (
    <div className="space-y-6">
      <div className="h-8 w-48 skeleton rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 skeleton rounded-2xl" />)}
      </div>
      <div className="h-80 skeleton rounded-2xl" />
    </div>
  )

  const stats = data?.stats || {}

  // Build chart data from revenueByDay (array of payments)
  const revenueMap: Record<string, number> = {}
  ;(data?.revenueByDay || []).forEach((item: any) => {
    const date = format(new Date(item.createdAt), 'dd MMM')
    revenueMap[date] = (revenueMap[date] || 0) + (item.amount || 0)
  })
  const chartData = Object.entries(revenueMap).map(([date, amount]) => ({ date, amount }))

  const statCards = [
    { label: 'Total Users',    value: stats.totalUsers    ?? 0, icon: Users,        color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
    { label: 'Total Movies',   value: stats.totalMovies   ?? 0, icon: Film,         color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Total Bookings', value: stats.totalBookings ?? 0, icon: Ticket,       color: 'text-green-400',  bg: 'bg-green-500/10'  },
    { label: 'Total Revenue',  value: `₹${(stats.totalRevenue ?? 0).toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-dark-400">Welcome back, Admin. Here's what's happening today.</p>
        </div>
        <button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="btn-primary"
        >
          <RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          {syncMutation.isPending ? 'Syncing...' : 'Sync TMDB Movies'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="glass-card p-6 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-dark-400 text-sm font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-brand-500" />
          <h3 className="text-lg font-bold text-white">Revenue (Last 7 Days)</h3>
        </div>
        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-dark-500 text-sm">
            No sales data yet — revenue will appear here once bookings are made.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Bar dataKey="amount" fill="#e50914" radius={[6, 6, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent Bookings + Top Movies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Bookings */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-4">Recent Bookings</h3>
          {(!data?.recentBookings || data.recentBookings.length === 0) ? (
            <p className="text-dark-500 text-sm py-8 text-center">No bookings yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-dark-400 border-b border-dark-700">
                    <th className="text-left pb-3 font-medium">User</th>
                    <th className="text-left pb-3 font-medium">Movie</th>
                    <th className="text-right pb-3 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700/50">
                  {data.recentBookings.map((booking: any) => (
                    <tr key={booking.id} className="text-dark-200">
                      <td className="py-3">
                        <p className="font-medium text-white">{booking.user?.name}</p>
                        <p className="text-xs text-dark-400">{booking.user?.email}</p>
                      </td>
                      <td className="py-3 text-dark-300">{booking.show?.movie?.title ?? '—'}</td>
                      <td className="py-3 text-right font-medium text-brand-400">
                        ₹{booking.payment?.amount?.toLocaleString('en-IN') ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Movies */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-4">Top Rated Movies</h3>
          {(!data?.topMovies || data.topMovies.length === 0) ? (
            <p className="text-dark-500 text-sm py-8 text-center">No movies in database yet.</p>
          ) : (
            <div className="space-y-4">
              {data.topMovies.map((movie: any) => (
                <div key={movie.id} className="flex items-center gap-4">
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="w-12 h-16 rounded-lg object-cover bg-dark-700 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">{movie.title}</p>
                    <p className="text-xs text-dark-400">{movie._count?.shows ?? 0} shows scheduled</p>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500 font-bold flex-shrink-0">
                    ⭐ <span>{movie.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
