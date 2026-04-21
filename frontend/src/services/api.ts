import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Request Interceptor — Attach access token ───────────────────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Response Interceptor — Handle 401 / refresh token ──────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const res = await axios.post('/api/auth/refresh', {}, { withCredentials: true })
        const newToken = res.data?.data?.accessToken
        useAuthStore.getState().setAccessToken(newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch {
        useAuthStore.getState().logout()
        window.location.href = '/auth/login'
        return Promise.reject(error)
      }
    }

    const message = error.response?.data?.message || 'Something went wrong'
    if (error.response?.status !== 401) toast.error(message)

    return Promise.reject(error)
  },
)

// ─── API Methods ──────────────────────────────────────────────────────────────

// Auth
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  sendOtp: (data: any) => api.post('/auth/send-otp', data),
  verifyOtp: (data: any) => api.post('/auth/verify-otp', data),
  forgotPassword: (data: any) => api.post('/auth/forgot-password', data),
  resetPassword: (data: any) => api.post('/auth/reset-password', data),
  getMe: () => api.get('/auth/me'),
  updateMe: (data: any) => api.patch('/auth/me', data),
}

// Movies
export const moviesApi = {
  getAll: (params?: any) => api.get('/movies', { params }),
  getBySlug: (slug: string) => api.get(`/movies/${slug}`),
  getGenres: () => api.get('/movies/genres'),
  create: (data: any) => api.post('/movies', data),
  update: (id: string, data: any) => api.put(`/movies/${id}`, data),
  delete: (id: string) => api.delete(`/movies/${id}`),
}

// Theatres
export const theatresApi = {
  getAll: (params?: any) => api.get('/theatres', { params }),
  getById: (id: string) => api.get(`/theatres/${id}`),
  getCities: () => api.get('/theatres/cities'),
  create: (data: any) => api.post('/theatres', data),
  update: (id: string, data: any) => api.put(`/theatres/${id}`, data),
  delete: (id: string) => api.delete(`/theatres/${id}`),
  createScreen: (theatreId: string, data: any) => api.post(`/theatres/${theatreId}/screens`, data),
  updateScreen: (id: string, data: any) => api.put(`/theatres/screens/${id}`, data),
  deleteScreen: (id: string) => api.delete(`/theatres/screens/${id}`),
}

// Shows
export const showsApi = {
  getByMovie: (movieId: string, params?: any) => api.get(`/shows/movie/${movieId}`, { params }),
  getById: (id: string) => api.get(`/shows/${id}`),
  create: (data: any) => api.post('/shows', data),
  update: (id: string, data: any) => api.put(`/shows/${id}`, data),
  delete: (id: string) => api.delete(`/shows/${id}`),
}

// Seats
export const seatsApi = {
  getByShow: (showId: string) => api.get(`/seats/show/${showId}`),
  lock: (data: { showId: string; seatIds: string[] }) => api.post('/seats/lock', data),
  unlock: (data: { showId: string; seatIds: string[] }) => api.post('/seats/unlock', data),
}

// Bookings
export const bookingsApi = {
  create: (data: any) => api.post('/bookings', data),
  getMy: (params?: any) => api.get('/bookings/my', { params }),
  getByRef: (ref: string) => api.get(`/bookings/${ref}`),
  cancel: (ref: string, data?: any) => api.patch(`/bookings/${ref}/cancel`, data),
}

// Payments
export const paymentsApi = {
  initiate: (data: any) => api.post('/payments/initiate', data),
  confirm: (data: any) => api.post('/payments/confirm', data),
  getStatus: (bookingId: string) => api.get(`/payments/${bookingId}`),
}

// Coupons (User)
export const couponsApi = {
  getActive: () => api.get('/coupons'),
  apply: (data: { code: string; orderAmount: number }) => api.post('/coupons/apply', data),
}

// Admin
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  getBookings: (params?: any) => api.get('/admin/bookings', { params }),
  toggleUserActive: (id: string) => api.patch(`/admin/users/${id}/toggle-active`),
  syncMovies: () => api.post('/admin/sync-movies'),
  // Coupon management
  getCoupons: (params?: any) => api.get('/admin/coupons', { params }),
  getCoupon: (id: string) => api.get(`/admin/coupons/${id}`),
  createCoupon: (data: any) => api.post('/admin/coupons', data),
  updateCoupon: (id: string, data: any) => api.put(`/admin/coupons/${id}`, data),
  toggleCoupon: (id: string) => api.patch(`/admin/coupons/${id}/toggle`),
  deleteCoupon: (id: string) => api.delete(`/admin/coupons/${id}`),
}

export default api
