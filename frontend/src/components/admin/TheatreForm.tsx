import React, { useState } from 'react'

interface TheatreFormProps {
  initialData?: any
  onSubmit: (data: any) => void
  isLoading?: boolean
}

export default function TheatreForm({ initialData, onSubmit, isLoading }: TheatreFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    pincode: initialData?.pincode || '',
    amenities: initialData?.amenities || [],
    isActive: initialData?.isActive ?? true,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    setFormData(prev => ({ ...prev, [name]: val }))
  }

  const handleAmenitiesChange = (value: string) => {
    const items = value.split(',').map(s => s.trim()).filter(Boolean)
    setFormData(prev => ({ ...prev, amenities: items }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="input-label">Theatre Name</label>
          <input 
            type="text" name="name" value={formData.name} onChange={handleChange} 
            className="input-field" required placeholder="PVR Cinemas" 
          />
        </div>
        <div className="md:col-span-2">
          <label className="input-label">Address</label>
          <input 
            type="text" name="address" value={formData.address} onChange={handleChange} 
            className="input-field" required placeholder="Street, Area" 
          />
        </div>
        <div>
          <label className="input-label">City</label>
          <input 
            type="text" name="city" value={formData.city} onChange={handleChange} 
            className="input-field" required placeholder="Mumbai" 
          />
        </div>
        <div>
          <label className="input-label">State</label>
          <input 
            type="text" name="state" value={formData.state} onChange={handleChange} 
            className="input-field" required placeholder="Maharashtra" 
          />
        </div>
        <div>
          <label className="input-label">Pincode</label>
          <input 
            type="text" name="pincode" value={formData.pincode} onChange={handleChange} 
            className="input-field" required placeholder="400001" 
          />
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} 
            id="isActive" className="w-5 h-5 accent-brand-500" 
          />
          <label htmlFor="isActive" className="text-white font-medium">Active Theatre</label>
        </div>
      </div>

      <div>
        <label className="input-label">Amenities (comma separated)</label>
        <input 
          type="text" value={formData.amenities.join(', ')} 
          onChange={(e) => handleAmenitiesChange(e.target.value)} 
          className="input-field" placeholder="IMAX, Parking, Food Court" 
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-dark-700/50">
        <button type="submit" disabled={isLoading} className="btn-primary min-w-[120px]">
          {isLoading ? 'Saving...' : 'Save Theatre'}
        </button>
      </div>
    </form>
  )
}
