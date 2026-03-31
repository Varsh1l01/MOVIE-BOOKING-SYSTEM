import React, { useState } from 'react'

interface CouponFormProps {
  initialData?: any
  onSubmit: (data: any) => void
  isLoading?: boolean
}

export default function CouponForm({ initialData, onSubmit, isLoading }: CouponFormProps) {
  const [formData, setFormData] = useState({
    code: initialData?.code || '',
    description: initialData?.description || '',
    type: initialData?.type || 'PERCENTAGE',
    value: initialData?.value || 10,
    minBookingAmount: initialData?.minBookingAmount || 500,
    maxDiscount: initialData?.maxDiscount || 200,
    startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    expiryDate: initialData?.expiryDate ? new Date(initialData.expiryDate).toISOString().split('T')[0] : '',
    usageLimit: initialData?.usageLimit || 100,
    isActive: initialData?.isActive ?? true,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    setFormData(prev => ({ ...prev, [name]: val }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      value: Number(formData.value),
      minBookingAmount: Number(formData.minBookingAmount),
      maxDiscount: Number(formData.maxDiscount),
      usageLimit: Number(formData.usageLimit),
      startDate: new Date(formData.startDate),
      expiryDate: new Date(formData.expiryDate),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="input-label">Coupon Code</label>
          <input 
            type="text" name="code" value={formData.code} onChange={handleChange} 
            className="input-field uppercase font-mono" required placeholder="OFF20" 
          />
        </div>
        <div>
          <label className="input-label">Discount Type</label>
          <select name="type" value={formData.type} onChange={handleChange} className="input-field">
            <option value="PERCENTAGE">Percentage (%)</option>
            <option value="FIXED">Fixed Amount (₹)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="input-label">Description</label>
        <input 
          type="text" name="description" value={formData.description} onChange={handleChange} 
          className="input-field" placeholder="Get 20% off on bookings above ₹500" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="input-label">Value ({formData.type === 'PERCENTAGE' ? '%' : '₹'})</label>
          <input type="number" name="value" value={formData.value} onChange={handleChange} className="input-field" required />
        </div>
        <div>
          <label className="input-label">Min Booking (₹)</label>
          <input type="number" name="minBookingAmount" value={formData.minBookingAmount} onChange={handleChange} className="input-field" required />
        </div>
        <div>
          <label className="input-label">Max Discount (₹)</label>
          <input type="number" name="maxDiscount" value={formData.maxDiscount} onChange={handleChange} className="input-field" required />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="input-label">Start Date</label>
          <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="input-field" required />
        </div>
        <div>
          <label className="input-label">Expiry Date</label>
          <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} className="input-field" required />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="input-label">Usage Limit</label>
          <input type="number" name="usageLimit" value={formData.usageLimit} onChange={handleChange} className="input-field" required />
        </div>
        <div className="flex items-center gap-3 pt-6">
          <input 
            type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} 
            id="isCouponActive" className="w-5 h-5 accent-brand-500" 
          />
          <label htmlFor="isCouponActive" className="text-white font-medium">Active</label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-dark-700/50">
        <button type="submit" disabled={isLoading} className="btn-primary min-w-[120px]">
          {isLoading ? 'Saving...' : 'Save Coupon'}
        </button>
      </div>
    </form>
  )
}
