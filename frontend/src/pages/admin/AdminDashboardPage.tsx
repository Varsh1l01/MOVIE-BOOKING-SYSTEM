import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../services/api'
import { 
  BarChart, Bar, XIndex, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
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
    onError: () => {
      toast.error('Failed to sync movies. Check TMDB API key.')
    }
  })

  if (isLoading) return (
    <div className="space-y-6">
      <div className="h-8 w-48 skeleton" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="h-32 skeleton rounded-2xl" />)}
      </div>
      <div className="h-80 skeleton rounded-2xl" />
    </div>
  )

  const stats = data?.stats || {}
  const revenueData = data?.revenueByDay?.map((item: any) => ({
    date: format(new Date(item.createdAt), 'MMM dd'),
    amount: item.amount
  })) || []

  // Group by date for chart
  const processedRevenue = revenueData.reduce((acc: any[], curr: any) => {
    const existing = acc.find(a => a.date === curr.date)
    if (existing) {
      existing.amount += curr.amount
    } else {
      acc.push({ ...curr })
    }
    return acc
  }, [])

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Total Movies', value: stats.totalMovies, icon: Film, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Total Bookings', value: stats.totalBookings, icon: Ticket, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: IndianRupee, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  ]

  return (
    <div className="space-y-8">
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
          <h3 className="text-lg font-bold text-white">Revenue Trends (Last 7 Days)</h3>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={processedRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey="amount" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Bookings */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-4">Recent Bookings</h3>
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
                {data?.recentBookings?.map((booking: any) => (
                  <tr key={booking.id} className="text-dark-200">
                    <td className="py-3">
                      <p className="font-medium text-white">{booking.user.name}</p>
                      <p className="text-xs text-dark-400">{booking.user.email}</p>
                    </td>
                    <td className="py-3">{booking.show.movie.title}</td>
                    <td className="py-3 text-right font-medium text-brand-400">₹{booking.payment.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Movies */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-4">Top Rated Movies</h3>
          <div className="space-y-4">
            {data?.topMovies?.map((movie: any) => (
              <div key={movie.id} className="flex items-center gap-4">
                <img src={movie.posterUrl} alt={movie.title} className="w-12 h-16 rounded-lg object-cover bg-dark-700" />
                <div className="flex-1">
                  <p className="font-bold text-white">{movie.title}</p>
                  <p className="text-xs text-dark-400">{movie._count.shows} upcoming shows</p>
                </div>
                <div className="flex items-center gap-1 text-yellow-500 font-bold">
                  <span>{movie.rating}</span>
                  <span className="text-xs text-dark-500">/ 10</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
