import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../services/api'
import { Plus, Edit2, Trash2, Ticket, Percent, Calendar, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../../components/common/Modal'
import CouponForm from '../../components/admin/CouponForm'
import { format } from 'date-fns'

export default function AdminCouponsPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<any>(null)

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => adminApi.getCoupons().then((r) => r.data?.data || []),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => adminApi.createCoupon(data),
    onSuccess: () => {
      toast.success('Coupon created')
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
      setIsModalOpen(false)
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create coupon'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.updateCoupon(id, data),
    onSuccess: () => {
      toast.success('Coupon updated')
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
      setIsModalOpen(false)
      setEditingCoupon(null)
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update coupon'),
  })

  const toggleMutation = useMutation({
    mutationFn: (id: string) => adminApi.toggleCoupon(id),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Coupon toggled')
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteCoupon(id),
    onSuccess: () => {
      toast.success('Coupon deleted')
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
    },
  })

  const handleEdit = (coupon: any) => {
    setEditingCoupon(coupon)
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this coupon? This cannot be undone.')) {
      deleteMutation.mutate(id)
    }
  }

  const handleSubmit = (data: any) => {
    if (editingCoupon) {
      updateMutation.mutate({ id: editingCoupon.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const now = new Date()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Coupons</h1>
          <p className="text-dark-400">Create and manage discount codes for your users.</p>
        </div>
        <button
          onClick={() => { setEditingCoupon(null); setIsModalOpen(true) }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          Add Coupon
        </button>
      </div>

      {/* Coupon Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [1, 2, 3].map(i => <div key={i} className="h-56 skeleton rounded-2xl" />)
        ) : coupons?.length === 0 ? (
          <div className="col-span-3 text-center py-16 text-dark-500">
            <Ticket className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No coupons yet. Create your first one!</p>
          </div>
        ) : coupons?.map((coupon: any) => {
          const isExpired = now > new Date(coupon.validUntil)
          const effectivelyActive = coupon.isActive && !isExpired && coupon.usedCount < coupon.usageLimit

          return (
            <div key={coupon.id} className="glass-card p-5 flex flex-col gap-4 group">
              {/* Top Row */}
              <div className="flex justify-between items-start">
                <div className={`p-2.5 rounded-xl ${effectivelyActive ? 'bg-brand-500/15 text-brand-400' : 'bg-dark-700 text-dark-500'}`}>
                  <Ticket className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1">
                  {/* Toggle */}
                  <button
                    onClick={() => toggleMutation.mutate(coupon.id)}
                    disabled={toggleMutation.isPending}
                    title={coupon.isActive ? 'Deactivate' : 'Activate'}
                    className="p-2 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-white transition-colors"
                  >
                    {coupon.isActive
                      ? <ToggleRight className="w-4 h-4 text-green-400" />
                      : <ToggleLeft className="w-4 h-4 text-dark-500" />
                    }
                  </button>
                  <button
                    onClick={() => handleEdit(coupon)}
                    className="p-2 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-white transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(coupon.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-dark-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Code & Description */}
              <div>
                <h3 className="text-xl font-mono font-bold text-white uppercase tracking-wider">{coupon.code}</h3>
                <p className="text-dark-400 text-sm mt-0.5 line-clamp-1">{coupon.description || 'No description'}</p>
              </div>

              {/* Details */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-dark-300">
                  <Percent className="w-3 h-3 text-brand-500 flex-shrink-0" />
                  <span>
                    {coupon.type === 'PERCENTAGE'
                      ? `${coupon.value}% off${coupon.maxDiscount ? ` (max ₹${coupon.maxDiscount})` : ''}`
                      : `₹${coupon.value} flat off`}
                    {coupon.minOrderAmount > 0 ? ` — min ₹${coupon.minOrderAmount}` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-dark-300">
                  <Calendar className="w-3 h-3 text-brand-500 flex-shrink-0" />
                  <span className={isExpired ? 'text-red-400' : ''}>
                    {isExpired ? 'Expired' : 'Expires'} {format(new Date(coupon.validUntil), 'dd MMM yyyy')}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-dark-700/50 flex justify-between items-center">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                  effectivelyActive
                    ? 'bg-green-500/10 text-green-400'
                    : isExpired
                    ? 'bg-orange-500/10 text-orange-400'
                    : 'bg-red-500/10 text-red-400'
                }`}>
                  {effectivelyActive ? 'Active' : isExpired ? 'Expired' : 'Disabled'}
                </span>
                <span className="text-[10px] text-dark-500 font-bold uppercase tracking-widest">
                  Used: {coupon.usedCount ?? 0} / {coupon.usageLimit}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingCoupon(null) }}
        title={editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
      >
        <CouponForm
          initialData={editingCoupon}
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>
    </div>
  )
}
