import React, { useState } from 'react'
import { ScreenType } from '../../types/admin'

interface ScreenFormProps {
  initialData?: any
  onSubmit: (data: any) => void
  isLoading?: boolean
}

export default function ScreenForm({ initialData, onSubmit, isLoading }: ScreenFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    type: initialData?.type || ScreenType.REGULAR,
    rows: initialData?.rows || 10,
    seatsPerRow: initialData?.seatsPerRow || 12,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      rows: Number(formData.rows),
      seatsPerRow: Number(formData.seatsPerRow),
      totalSeats: Number(formData.rows) * Number(formData.seatsPerRow)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="input-label">Screen Name</label>
          <input 
            type="text" name="name" value={formData.name} onChange={handleChange} 
            className="input-field" required placeholder="Screen 1 or IMAX Hall" 
          />
        </div>
        <div>
          <label className="input-label">Screen Type</label>
          <select name="type" value={formData.type} onChange={handleChange} className="input-field">
            <option value={ScreenType.REGULAR}>Regular</option>
            <option value={ScreenType.IMAX}>IMAX</option>
            <option value={ScreenType.PREMIUM}>Premium</option>
            <option value={ScreenType.FOUR_DX}>4DX</option>
          </select>
        </div>
        {!initialData && (
          <>
            <div>
              <label className="input-label">Rows</label>
              <input 
                type="number" name="rows" value={formData.rows} onChange={handleChange} 
                className="input-field" required min="1" max="26"
              />
              <p className="text-[10px] text-dark-500 mt-1">Rows will be named A-Z</p>
            </div>
            <div>
              <label className="input-label">Seats Per Row</label>
              <input 
                type="number" name="seatsPerRow" value={formData.seatsPerRow} onChange={handleChange} 
                className="input-field" required min="1" max="30"
              />
              <p className="text-[10px] text-dark-500 mt-1">Total: {formData.rows * formData.seatsPerRow} seats</p>
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-dark-700/50">
        <button type="submit" disabled={isLoading} className="btn-primary min-w-[120px]">
          {isLoading ? 'Saving...' : initialData ? 'Update Screen' : 'Create Screen & Seats'}
        </button>
      </div>
    </form>
  )
}
