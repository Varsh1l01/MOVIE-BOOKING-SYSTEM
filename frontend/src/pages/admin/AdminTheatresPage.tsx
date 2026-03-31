import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { theatresApi } from '../../services/api'
import { Plus, Edit2, Trash2, MapPin, Monitor, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../../components/common/Modal'
import TheatreForm from '../../components/admin/TheatreForm'
import ScreenForm from '../../components/admin/ScreenForm'

export default function AdminTheatresPage() {
  const queryClient = useQueryClient()
  const [isTheatreModalOpen, setIsTheatreModalOpen] = useState(false)
  const [isScreenModalOpen, setIsScreenModalOpen] = useState(false)
  const [editingTheatre, setEditingTheatre] = useState<any>(null)
  const [selectedTheatreId, setSelectedTheatreId] = useState<string | null>(null)

  const { data: theatres, isLoading } = useQuery({
    queryKey: ['admin-theatres'],
    queryFn: () => theatresApi.getAll({ limit: 50 }).then((r) => r.data?.data || []),
  })

  const createTheatreMutation = useMutation({
    mutationFn: (data: any) => theatresApi.create(data),
    onSuccess: () => {
      toast.success('Theatre created')
      queryClient.invalidateQueries({ queryKey: ['admin-theatres'] })
      setIsTheatreModalOpen(false)
    }
  })

  const updateTheatreMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => theatresApi.update(id, data),
    onSuccess: () => {
      toast.success('Theatre updated')
      queryClient.invalidateQueries({ queryKey: ['admin-theatres'] })
      setIsTheatreModalOpen(false)
      setEditingTheatre(null)
    }
  })

  const deleteTheatreMutation = useMutation({
    mutationFn: (id: string) => theatresApi.delete(id),
    onSuccess: () => {
      toast.success('Theatre deleted')
      queryClient.invalidateQueries({ queryKey: ['admin-theatres'] })
    }
  })

  const createScreenMutation = useMutation({
    mutationFn: (data: any) => theatresApi.createScreen(selectedTheatreId!, data),
    onSuccess: () => {
      toast.success('Screen created with seats')
      queryClient.invalidateQueries({ queryKey: ['admin-theatres'] })
      setIsScreenModalOpen(false)
    }
  })

  const deleteScreenMutation = useMutation({
    mutationFn: (id: string) => theatresApi.deleteScreen(id),
    onSuccess: () => {
      toast.success('Screen deleted')
      queryClient.invalidateQueries({ queryKey: ['admin-theatres'] })
    }
  })

  const handleDeleteTheatre = (id: string) => {
    if (window.confirm('Delete this theatre and ALL its screens/shows?')) {
      deleteTheatreMutation.mutate(id)
    }
  }

  const handleDeleteScreen = (id: string) => {
    if (window.confirm('Delete this screen and ALL its seats/shows?')) {
      deleteScreenMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Theatres</h1>
          <p className="text-dark-400">Configure cinema locations and screen layouts.</p>
        </div>
        <button 
          onClick={() => { setEditingTheatre(null); setIsTheatreModalOpen(true); }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          Add Theatre
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          [1,2].map(i => <div key={i} className="h-40 skeleton rounded-2xl" />)
        ) : theatres?.map((theatre: any) => (
          <div key={theatre.id} className="glass-card overflow-hidden">
            <div className="p-6 flex flex-col md:flex-row justify-between gap-6 border-b border-dark-700/50">
              <div className="flex gap-4">
                <div className="p-3 bg-brand-500/10 text-brand-400 rounded-xl h-fit">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{theatre.name}</h3>
                  <p className="text-dark-400 text-sm max-w-md">{theatre.address}, {theatre.city}</p>
                  <div className="flex gap-2 mt-3">
                    {theatre.amenities.map((a: string) => (
                      <span key={a} className="px-2 py-0.5 rounded-lg bg-dark-700 text-dark-300 text-[10px] font-medium uppercase">{a}</span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                   onClick={() => { setEditingTheatre(theatre); setIsTheatreModalOpen(true); }}
                   className="btn-secondary px-4 py-2 text-sm"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button 
                  onClick={() => handleDeleteTheatre(theatre.id)}
                  className="btn-secondary px-4 py-2 text-sm text-red-400 border-red-500/20 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 bg-dark-900/30">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-blue-400" />
                  Screens ({theatre.screens.length})
                </h4>
                <button 
                  onClick={() => { setSelectedTheatreId(theatre.id); setIsScreenModalOpen(true); }}
                  className="text-brand-500 hover:text-brand-400 text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Screen
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {theatre.screens.map((screen: any) => (
                  <div key={screen.id} className="bg-dark-800/50 border border-dark-700 rounded-xl p-4 flex justify-between items-center group">
                    <div>
                      <p className="font-bold text-white text-sm">{screen.name}</p>
                      <p className="text-[10px] text-dark-400 uppercase tracking-widest">{screen.type} • {screen.totalSeats} SEATS</p>
                    </div>
                    <button 
                      onClick={() => handleDeleteScreen(screen.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-dark-500 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {theatre.screens.length === 0 && (
                  <div className="col-span-full py-4 text-center text-dark-500 text-sm italic">
                    No screens added yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Theatre Modal */}
      <Modal isOpen={isTheatreModalOpen} onClose={() => setIsTheatreModalOpen(false)} title={editingTheatre ? 'Edit Theatre' : 'Add New Theatre'}>
        <TheatreForm 
          initialData={editingTheatre} 
          onSubmit={(data) => editingTheatre ? updateTheatreMutation.mutate({ id: editingTheatre.id, data }) : createTheatreMutation.mutate(data)} 
          isLoading={createTheatreMutation.isPending || updateTheatreMutation.isPending}
        />
      </Modal>

      {/* Screen Modal */}
      <Modal isOpen={isScreenModalOpen} onClose={() => setIsScreenModalOpen(false)} title="Add New Screen">
        <ScreenForm 
          onSubmit={(data) => createScreenMutation.mutate(data)} 
          isLoading={createScreenMutation.isPending}
        />
      </Modal>
    </div>
  )
}
