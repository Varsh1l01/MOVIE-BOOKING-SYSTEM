import React, { useState } from 'react'
import { MovieStatus } from '../../types/admin'

interface MovieFormProps {
  initialData?: any
  onSubmit: (data: any) => void
  isLoading?: boolean
}

export default function MovieForm({ initialData, onSubmit, isLoading }: MovieFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    posterUrl: initialData?.posterUrl || '',
    bannerUrl: initialData?.bannerUrl || '',
    genre: initialData?.genre || [],
    language: initialData?.language || ['English'],
    duration: initialData?.duration || 120,
    releaseDate: initialData?.releaseDate ? new Date(initialData.releaseDate).toISOString().split('T')[0] : '',
    rating: initialData?.rating || 0,
    status: initialData?.status || MovieStatus.NOW_PLAYING,
    director: initialData?.director || '',
    cast: initialData?.cast || [],
    certification: initialData?.certification || 'UA',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleArrayChange = (name: 'genre' | 'language' | 'cast', value: string) => {
    const items = value.split(',').map(s => s.trim()).filter(Boolean)
    setFormData(prev => ({ ...prev, [name]: items }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      duration: Number(formData.duration),
      rating: Number(formData.rating),
      releaseDate: new Date(formData.releaseDate),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="input-label">Title</label>
          <input 
            type="text" name="title" value={formData.title} onChange={handleChange} 
            className="input-field" required placeholder="Movie Title" 
          />
        </div>
        <div>
          <label className="input-label">Status</label>
          <select name="status" value={formData.status} onChange={handleChange} className="input-field">
            <option value={MovieStatus.NOW_PLAYING}>Now Playing</option>
            <option value={MovieStatus.UPCOMING}>Upcoming</option>
            <option value={MovieStatus.FINISHED}>Finished</option>
          </select>
        </div>
      </div>

      <div>
        <label className="input-label">Description</label>
        <textarea 
          name="description" value={formData.description} onChange={handleChange} 
          className="input-field min-h-[100px]" required placeholder="Movie Description"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="input-label">Poster URL</label>
          <input 
            type="url" name="posterUrl" value={formData.posterUrl} onChange={handleChange} 
            className="input-field" required placeholder="https://..." 
          />
        </div>
        <div>
          <label className="input-label">Banner URL</label>
          <input 
            type="url" name="bannerUrl" value={formData.bannerUrl} onChange={handleChange} 
            className="input-field" placeholder="https://..." 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="input-label">Duration (min)</label>
          <input 
            type="number" name="duration" value={formData.duration} onChange={handleChange} 
            className="input-field" required 
          />
        </div>
        <div>
          <label className="input-label">Rating</label>
          <input 
            type="number" step="0.1" name="rating" value={formData.rating} onChange={handleChange} 
            className="input-field" required 
          />
        </div>
        <div>
          <label className="input-label">Release Date</label>
          <input 
            type="date" name="releaseDate" value={formData.releaseDate} onChange={handleChange} 
            className="input-field" required 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="input-label">Genres (comma separated)</label>
          <input 
            type="text" value={formData.genre.join(', ')} 
            onChange={(e) => handleArrayChange('genre', e.target.value)} 
            className="input-field" placeholder="Action, Drama, Thriller" 
          />
        </div>
        <div>
          <label className="input-label">Languages (comma separated)</label>
          <input 
            type="text" value={formData.language.join(', ')} 
            onChange={(e) => handleArrayChange('language', e.target.value)} 
            className="input-field" placeholder="Hindi, English, Telugu" 
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button type="submit" disabled={isLoading} className="btn-primary min-w-[120px]">
          {isLoading ? 'Saving...' : 'Save Movie'}
        </button>
      </div>
    </form>
  )
}
