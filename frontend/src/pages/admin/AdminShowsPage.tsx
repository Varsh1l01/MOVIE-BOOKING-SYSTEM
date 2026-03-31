import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { showsApi, moviesApi } from '../../services/api'
import { Plus, Trash2, Calendar, Clock, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../../components/common/Modal'
import ShowForm from '../../components/admin/ShowForm'
import { format } from 'date-fns'

export default function AdminShowsPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedMovieId, setSelectedMovieId] = useState('')

  const { data: movies } = useQuery({ 
    queryKey: ['movies-list-shows'], 
    queryFn: () => moviesApi.getAll({ limit: 100 }).then(r => r.data?.data) 
  })

  const { data: shows, isLoading } = useQuery({
    queryKey: ['admin-shows', selectedMovieId],
    queryFn: () => selectedMovieId ? showsApi.getByMovie(selectedMovieId).then(r => r.data?.data || []) : Promise.resolve([]),
    enabled: !!selectedMovieId
  })

  // shows are grouped by theatre on the backend
  const flatShows = shows?.flatMap((g: any) => g.shows) || []

  const createMutation = useMutation({
    mutationFn: (data: any) => showsApi.create(data),
    onSuccess: () => {
      toast.success('Show created successfully')
      queryClient.invalidateQueries({ queryKey: ['admin-shows'] })
      setIsModalOpen(false)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => showsApi.delete(id),
    onSuccess: () => {
      toast.success('Show deleted')
      queryClient.invalidateQueries({ queryKey: ['admin-shows'] })
    }
  })

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this show timing?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Show Timings</h1>
          <p className="text-dark-400">Schedule movie sessions across different screens.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          Schedule Show
        </button>
      </div>

      <div className="glass-card p-6">
        <label className="input-label">Filter by Movie</label>
        <select 
          value={selectedMovieId} 
          onChange={(e) => setSelectedMovieId(e.target.value)}
          className="input-field max-w-md"
        >
          <option value="">Select a movie to view timings</option>
          {movies?.map((m: any) => (
            <option key={m.id} value={m.id}>{m.title}</option>
          ))}
        </select>
      </div>

      {!selectedMovieId && (
        <div className="py-20 text-center glass-card">
          <Calendar className="w-12 h-12 text-dark-500 mx-auto mb-4" />
          <p className="text-dark-400">Please select a movie to manage its show timings.</p>
        </div>
      )}

      {selectedMovieId && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
             <table className="w-full text-sm">
                <thead className="bg-dark-700/60 text-dark-300">
                  <tr>
                    <th className="text-left p-4 font-medium uppercase tracking-wider">Theatre & Screen</th>
                    <th className="text-left p-4 font-medium uppercase tracking-wider">Date & Time</th>
                    <th className="text-left p-4 font-medium uppercase tracking-wider">Format</th>
                    <th className="text-left p-4 font-medium uppercase tracking-wider">Prices</th>
                    <th className="text-right p-4 font-medium uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700/50">
                  {isLoading ? (
                    <tr><td colSpan={5} className="p-10"><div className="h-20 skeleton rounded-xl" /></td></tr>
                  ) : flatShows.length === 0 ? (
                    <tr><td colSpan={5} className="p-10 text-center text-dark-400">No shows scheduled for this movie yet.</td></tr>
                  ) : flatShows.map((show: any) => (
                    <tr key={show.id} className="hover:bg-dark-700/30">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><MapPin className="w-4 h-4" /></div>
                          <div>
                            <p className="font-bold text-white">{show.screen.theatre.name}</p>
                            <p className="text-xs text-dark-400">{show.screen.name} ({show.screen.type})</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3 text-dark-200">
                          <Calendar className="w-4 h-4 text-dark-400" />
                          <span>{format(new Date(show.startTime), 'MMM dd, yyyy')}</span>
                          <Clock className="w-4 h-4 text-dark-400 ml-2" />
                          <span className="font-bold">{format(new Date(show.startTime), 'hh:mm a')}</span>
                        </div>
                      </td>
                      <td className="p-4 uppercase text-[10px] tracking-widest font-bold">
                        <span className="px-2 py-1 bg-dark-700 rounded-lg border border-dark-600">
                          {show.language} • {show.format}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-[10px] text-dark-400">
                          <span className="text-brand-400">₹{show.priceRegular}</span> / ₹{show.pricePremium} / ₹{show.priceRecliner}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => handleDelete(show.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-dark-500 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule New Show">
        <ShowForm onSubmit={(data) => createMutation.mutate(data)} isLoading={createMutation.isPending} />
      </Modal>
    </div>
  )
}
