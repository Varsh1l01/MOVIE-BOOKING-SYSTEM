import { useState, useMemo } from 'react'
import { ShowFormat } from '../../types/admin'
import { useQuery } from '@tanstack/react-query'
import { moviesApi, theatresApi } from '../../services/api'

interface ShowFormProps {
  onSubmit: (data: any) => void
  isLoading?: boolean
}

export default function ShowForm({ onSubmit, isLoading }: ShowFormProps) {
  const { data: movies } = useQuery({ queryKey: ['movies-list'], queryFn: () => moviesApi.getAll({ limit: 100 }).then(r => r.data?.data) })
  const { data: theatres } = useQuery({ queryKey: ['theatres-list'], queryFn: () => theatresApi.getAll().then(r => r.data?.data) })

  const [formData, setFormData] = useState({
    movieId: '',
    theatreId: '',
    screenId: '',
    date: new Date().toISOString().split('T')[0],
    time: '18:00',
    format: ShowFormat.TWO_D,
    language: 'Hindi',
    priceRegular: 200,
    pricePremium: 350,
    priceRecliner: 550,
    priceCouple: 700,
  })

  // Get screens of selected theatre
  const screens = useMemo(() => {
    if (!formData.theatreId || !theatres) return []
    return theatres.find((t: any) => t.id === formData.theatreId)?.screens || []
  }, [formData.theatreId, theatres])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const startTime = new Date(`${formData.date}T${formData.time}`)
    const endTime = new Date(startTime.getTime() + 3 * 60 * 60 * 1000) // Default 3h

    onSubmit({
      movieId: formData.movieId,
      screenId: formData.screenId,
      startTime,
      endTime,
      language: formData.language,
      format: formData.format,
      priceRegular: Number(formData.priceRegular),
      pricePremium: Number(formData.pricePremium),
      priceRecliner: Number(formData.priceRecliner),
      priceCouple: Number(formData.priceCouple),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="input-label">Select Movie</label>
          <select name="movieId" value={formData.movieId} onChange={handleChange} className="input-field" required>
            <option value="">Select a movie</option>
            {movies?.filter((m:any) => m.status !== 'FINISHED').map((m: any) => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="input-label">Language / Format</label>
          <div className="grid grid-cols-2 gap-2">
            <input type="text" name="language" value={formData.language} onChange={handleChange} className="input-field" placeholder="Hindi" />
            <select name="format" value={formData.format} onChange={handleChange} className="input-field">
              <option value="TWO_D">2D</option>
              <option value="THREE_D">3D</option>
              <option value="IMAX">IMAX</option>
              <option value="FOUR_DX">4DX</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="input-label">Theatre</label>
          <select name="theatreId" value={formData.theatreId} onChange={handleChange} className="input-field" required>
            <option value="">Select a theatre</option>
            {theatres?.map((t: any) => (
              <option key={t.id} value={t.id}>{t.name} ({t.city})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="input-label">Screen</label>
          <select 
            name="screenId" value={formData.screenId} onChange={handleChange} 
            className="input-field" required disabled={!formData.theatreId}
          >
            <option value="">Select a screen</option>
            {screens.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name} ({s.type})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="input-label">Show Date</label>
          <input type="date" name="date" value={formData.date} onChange={handleChange} className="input-field" required />
        </div>
        <div>
          <label className="input-label">Start Time</label>
          <input type="time" name="time" value={formData.time} onChange={handleChange} className="input-field" required />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4">
         <div>
          <label className="input-label text-[10px]">Price: REGULAR</label>
          <input type="number" name="priceRegular" value={formData.priceRegular} onChange={handleChange} className="input-field" required />
        </div>
        <div>
          <label className="input-label text-[10px]">Price: PREMIUM</label>
          <input type="number" name="pricePremium" value={formData.pricePremium} onChange={handleChange} className="input-field" required />
        </div>
        <div>
          <label className="input-label text-[10px]">Price: RECLINER</label>
          <input type="number" name="priceRecliner" value={formData.priceRecliner} onChange={handleChange} className="input-field" required />
        </div>
        <div>
          <label className="input-label text-[10px]">Price: COUPLE</label>
          <input type="number" name="priceCouple" value={formData.priceCouple} onChange={handleChange} className="input-field" required />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-dark-700/50">
        <button type="submit" disabled={isLoading} className="btn-primary min-w-[120px]">
          {isLoading ? 'Creating...' : 'Create Show'}
        </button>
      </div>
    </form>
  )
}
