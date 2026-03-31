import { Router } from 'express';
import { getDashboardStats, getAllUsers, getAllBookings, toggleUserActive, syncMovies } from './admin.controller';
import { authenticate, requireRole } from '../../middleware/authenticate';

const router = Router();

router.use(authenticate, requireRole('ADMIN', 'SUPER_ADMIN'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/bookings', getAllBookings);
router.patch('/users/:id/toggle-active', toggleUserActive);
router.post('/sync-movies', syncMovies);

export default router;
