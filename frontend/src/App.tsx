import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Layouts
import MainLayout from './components/layout/MainLayout'
import AdminLayout from './components/layout/AdminLayout'

// Pages
import HomePage from './pages/HomePage'
import MovieDetailPage from './pages/MovieDetailPage'
import ShowtimesPage from './pages/ShowtimesPage'
import SeatSelectionPage from './pages/SeatSelectionPage'
import CheckoutPage from './pages/CheckoutPage'
import BookingSuccessPage from './pages/BookingSuccessPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import OtpVerifyPage from './pages/auth/OtpVerifyPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminMoviesPage from './pages/admin/AdminMoviesPage'
import AdminTheatresPage from './pages/admin/AdminTheatresPage'
import AdminShowsPage from './pages/admin/AdminShowsPage'
import AdminBookingsPage from './pages/admin/AdminBookingsPage'
import AdminCouponsPage from './pages/admin/AdminCouponsPage'

// Guard
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth/login" replace />
}

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />
  if (!['ADMIN', 'SUPER_ADMIN'].includes(user?.role || '')) return <Navigate to="/" replace />
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />
      <Route path="/auth/verify-otp" element={<OtpVerifyPage />} />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />

      {/* Main App Routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/movie/:slug" element={<MovieDetailPage />} />
        <Route path="/movie/:slug/showtimes" element={<ShowtimesPage />} />
        <Route path="/book/:showId/seats" element={
          <ProtectedRoute><SeatSelectionPage /></ProtectedRoute>
        } />
        <Route path="/book/:showId/checkout" element={
          <ProtectedRoute><CheckoutPage /></ProtectedRoute>
        } />
        <Route path="/booking/:bookingRef/success" element={
          <ProtectedRoute><BookingSuccessPage /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><ProfilePage /></ProtectedRoute>
        } />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="movies" element={<AdminMoviesPage />} />
        <Route path="theatres" element={<AdminTheatresPage />} />
        <Route path="shows" element={<AdminShowsPage />} />
        <Route path="coupons" element={<AdminCouponsPage />} />
        <Route path="bookings" element={<AdminBookingsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
