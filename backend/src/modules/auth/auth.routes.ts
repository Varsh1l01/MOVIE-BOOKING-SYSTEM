import { Router } from 'express';
import {
  register, login, logout, refreshAccessToken,
  sendOtp, verifyOtp, forgotPassword, resetPassword,
  getMe, updateMe, registerValidators, loginValidators,
} from './auth.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';

const router = Router();

// Public routes
router.post('/register', registerValidators, validate, register);
router.post('/login', loginValidators, validate, login);
router.post('/logout', logout);
router.post('/refresh', refreshAccessToken);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, updateMe);

export default router;
