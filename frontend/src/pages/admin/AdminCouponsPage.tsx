import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { couponsApi } from '../../services/api'
import { Plus, Edit2, Trash2, Ticket, Percent, Calendar } from 'lucide-react'
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
    queryFn: () => couponsApi.getAll().then((r) => r.data?.data || []),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => couponsApi.create(data),
    onSuccess: () => {
      toast.success('Coupon created')
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
      setIsModalOpen(false)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => couponsApi.update(id, data),
    onSuccess: () => {
      toast.success('Coupon updated')
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
      setIsModalOpen(false)
      setEditingCoupon(null)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => couponsApi.delete(id),
    onSuccess: () => {
      toast.success('Coupon deleted')
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
    }
  })

  const handleEdit = (coupon: any) => {
    setEditingCoupon(coupon)
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this coupon?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Coupons</h1>
          <p className="text-dark-400">Offer discounts and drive more bookings.</p>
        </div>
        <button 
          onClick={() => { setEditingCoupon(null); setIsModalOpen(true); }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          Add Coupon
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [1,2,3].map(i => <div key={i} className="h-48 skeleton rounded-2xl" />)
        ) : coupons?.map((coupon: any) => (
          <div key={coupon.id} className="glass-card p-6 flex flex-col justify-between group h-fit">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${coupon.isActive ? 'bg-brand-500/10 text-brand-400' : 'bg-dark-700 text-dark-500'}`}>
                  <Ticket className="w-6 h-6" />
                </div>
                <div className="flex gap-1 group-hover:opacity-100 opacity-0 transition-opacity">
                   <button onClick={() => handleEdit(coupon)} className="p-2 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-white transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(coupon.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-dark-500 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="text-2xl font-mono font-bold text-white mb-1 uppercase tracking-wider">{coupon.code}</h3>
              <p className="text-dark-400 text-sm mb-4">{coupon.description}</p>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-xs text-dark-300">
                  <Percent className="w-3 h-3 text-brand-500" />
                  <span>{coupon.type === 'PERCENTAGE' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-dark-300">
                  <Calendar className="w-3 h-3 text-brand-500" />
                  <span>Expires {format(new Date(coupon.expiryDate), 'MMM dd, yyyy')}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-dark-700/50 flex justify-between items-center">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                coupon.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-500'
              }`}>
                {coupon.isActive ? 'Active' : 'Disabled'}
              </span>
              <span className="text-[10px] text-dark-500 font-bold uppercase tracking-widest">
                Used: {coupon._count?.usedBy || 0} / {coupon.usageLimit}
              </span>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCoupon ? 'Edit Coupon' : 'Create Coupon'}>
        <CouponForm 
          initialData={editingCoupon} 
          onSubmit={(data) => editingCoupon ? updateMutation.mutate({ id: editingCoupon.id, data }) : createMutation.mutate(data)} 
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>
    </div>
  )
}
