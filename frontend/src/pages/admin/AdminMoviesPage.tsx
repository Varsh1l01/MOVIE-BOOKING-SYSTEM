import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { moviesApi } from '../../services/api'
import { Plus, Edit2, Trash2, Search, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../../components/common/Modal'
import MovieForm from '../../components/admin/MovieForm'

export default function AdminMoviesPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMovie, setEditingMovie] = useState<any>(null)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-movies', search],
    queryFn: () => moviesApi.getAll({ limit: 50, search }).then((r) => r.data?.data || []),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => moviesApi.create(data),
    onSuccess: () => {
      toast.success('Movie created successfully')
      queryClient.invalidateQueries({ queryKey: ['admin-movies'] })
      setIsModalOpen(false)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => moviesApi.update(id, data),
    onSuccess: () => {
      toast.success('Movie updated successfully')
      queryClient.invalidateQueries({ queryKey: ['admin-movies'] })
      setIsModalOpen(false)
      setEditingMovie(null)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => moviesApi.delete(id),
    onSuccess: () => {
      toast.success('Movie deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['admin-movies'] })
    }
  })

  const handleEdit = (movie: any) => {
    setEditingMovie(movie)
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this movie?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleSubmit = (formData: any) => {
    if (editingMovie) {
      updateMutation.mutate({ id: editingMovie.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Movies</h1>
          <p className="text-dark-400">Add, edit, or remove movies from your catalog.</p>
        </div>
        <button 
          onClick={() => { setEditingMovie(null); setIsModalOpen(true); }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          Add Movie
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input 
            type="text" 
            placeholder="Search movies..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10" 
          />
        </div>
      </div>

      {/* Movies Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-dark-700/60 text-dark-300">
              <tr>
                <th className="text-left p-4 font-medium uppercase tracking-wider">Movie</th>
                <th className="text-left p-4 font-medium uppercase tracking-wider">Status</th>
                <th className="text-left p-4 font-medium uppercase tracking-wider">Genre</th>
                <th className="text-left p-4 font-medium uppercase tracking-wider">Rating</th>
                <th className="text-right p-4 font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/50">
              {isLoading ? (
                [1,2,3].map(i => <tr key={i}><td colSpan={5} className="p-4"><div className="h-12 skeleton rounded-xl" /></td></tr>)
              ) : data?.map((m: any) => (
                <tr key={m.id} className="hover:bg-dark-700/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={m.posterUrl} className="w-10 h-14 rounded object-cover bg-dark-700" alt={m.title} />
                      <div>
                        <p className="font-bold text-white">{m.title}</p>
                        <p className="text-xs text-dark-400">{m.duration} mins • {m.certification}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      m.status === 'NOW_PLAYING' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      {m.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-dark-300">{m.genre.slice(0, 2).join(', ')}</td>
                  <td className="p-4 font-medium text-yellow-500">{m.rating}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEdit(m)} className="p-2 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-white transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(m.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-dark-400 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingMovie ? 'Edit Movie' : 'Add New Movie'}
      >
        <MovieForm 
          initialData={editingMovie} 
          onSubmit={handleSubmit} 
          isLoading={createMutation.isPending || updateMutation.isPending} 
        />
      </Modal>
    </div>
  )
}
