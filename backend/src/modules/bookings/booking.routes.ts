import { Router } from 'express';
import { createBooking, getMyBookings, getBookingByRef, cancelBooking } from './booking.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

router.use(authenticate); // All booking routes require auth

router.post('/', createBooking);
router.get('/my', getMyBookings);
router.get('/:bookingRef', getBookingByRef);
router.patch('/:bookingRef/cancel', cancelBooking);

export default router;
