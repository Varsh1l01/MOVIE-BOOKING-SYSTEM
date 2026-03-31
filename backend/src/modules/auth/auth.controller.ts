import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { prisma } from '../../config/database';
import { hashPassword, comparePassword } from '../../utils/hash';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { sendSuccess, sendError } from '../../utils/response';
import { generateOtp, getOtpExpiry } from '../../utils/helpers';
import { AppError } from '../../middleware/errorHandler';
import { AuthRequest } from '../../middleware/authenticate';
import { sendOtpEmail, sendPasswordResetEmail, sendWelcomeEmail } from './auth.service';
import { OtpPurpose } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

// ─── Validators ─────────────────────────────────────────────────────────────
export const registerValidators = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit Indian phone number required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must be 8+ chars with uppercase, lowercase, number, and special character'),
];

export const loginValidators = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
];

// ─── Controllers ─────────────────────────────────────────────────────────────

/** POST /api/auth/register */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, phone, password } = req.body;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });
    if (existing) {
      throw new AppError('Email or phone already registered', 409);
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email, phone, passwordHash },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    });

    // Generate OTP for email verification
    const otpCode = generateOtp();
    await prisma.otp.create({
      data: {
        userId: user.id,
        code: otpCode,
        purpose: OtpPurpose.EMAIL_VERIFY,
        expiresAt: getOtpExpiry(10),
      },
    });

    await sendOtpEmail(email, name, otpCode, 'Email Verification');
    await sendWelcomeEmail(email, name);

    sendSuccess(res, user, 'Registration successful! Please verify your email.', 201);
  } catch (err) { next(err); }
};

/** POST /api/auth/login */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, phone: true, role: true, passwordHash: true, isActive: true, isVerified: true },
    });

    if (!user || !(await comparePassword(password, user.passwordHash))) {
      throw new AppError('Invalid email or password', 401);
    }
    if (!user.isActive) throw new AppError('Account deactivated. Contact support.', 403);

    const accessToken = signAccessToken({ userId: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id, email: user.email, role: user.role });

    // Save refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await prisma.refreshToken.create({ data: { userId: user.id, token: refreshToken, expiresAt } });

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { passwordHash: _, ...safeUser } = user;
    sendSuccess(res, { user: safeUser, accessToken }, 'Login successful');
  } catch (err) { next(err); }
};

/** POST /api/auth/logout */
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    res.clearCookie('refreshToken');
    sendSuccess(res, null, 'Logged out successfully');
  } catch (err) { next(err); }
};

/** POST /api/auth/refresh */
export const refreshAccessToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (!token) throw new AppError('Refresh token required', 401);

    const payload = verifyRefreshToken(token);
    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.expiresAt < new Date()) throw new AppError('Invalid or expired refresh token', 401);

    const newAccessToken = signAccessToken({ userId: payload.userId, email: payload.email, role: payload.role });
    sendSuccess(res, { accessToken: newAccessToken }, 'Token refreshed');
  } catch (err) { next(err); }
};

/** POST /api/auth/send-otp */
export const sendOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, purpose } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError('User not found', 404);

    // Invalidate old OTPs
    await prisma.otp.updateMany({
      where: { userId: user.id, purpose, used: false },
      data: { used: true },
    });

    const otpCode = generateOtp();
    await prisma.otp.create({
      data: { userId: user.id, code: otpCode, purpose, expiresAt: getOtpExpiry(10) },
    });

    await sendOtpEmail(email, user.name, otpCode, purpose);
    sendSuccess(res, null, 'OTP sent successfully');
  } catch (err) { next(err); }
};

/** POST /api/auth/verify-otp */
export const verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, code, purpose } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError('User not found', 404);

    const otp = await prisma.otp.findFirst({
      where: { userId: user.id, code, purpose, used: false, expiresAt: { gt: new Date() } },
    });

    if (!otp) throw new AppError('Invalid or expired OTP', 400);

    await prisma.otp.update({ where: { id: otp.id }, data: { used: true } });

    if (purpose === OtpPurpose.EMAIL_VERIFY) {
      await prisma.user.update({ where: { id: user.id }, data: { isVerified: true } });
    }

    sendSuccess(res, null, 'OTP verified successfully');
  } catch (err) { next(err); }
};

/** POST /api/auth/forgot-password */
export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    // Don't reveal whether user exists
    if (user) {
      const otpCode = generateOtp();
      await prisma.otp.create({
        data: { userId: user.id, code: otpCode, purpose: OtpPurpose.PASSWORD_RESET, expiresAt: getOtpExpiry(10) },
      });
      await sendPasswordResetEmail(email, user.name, otpCode);
    }
    sendSuccess(res, null, 'If the email exists, a reset OTP has been sent.');
  } catch (err) { next(err); }
};

/** POST /api/auth/reset-password */
export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, code, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError('User not found', 404);

    const otp = await prisma.otp.findFirst({
      where: { userId: user.id, code, purpose: OtpPurpose.PASSWORD_RESET, used: false, expiresAt: { gt: new Date() } },
    });
    if (!otp) throw new AppError('Invalid or expired OTP', 400);

    const passwordHash = await hashPassword(newPassword);
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
      prisma.otp.update({ where: { id: otp.id }, data: { used: true } }),
      prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
    ]);

    sendSuccess(res, null, 'Password reset successfully. Please log in again.');
  } catch (err) { next(err); }
};

/** GET /api/auth/me */
export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, name: true, email: true, phone: true, role: true, isVerified: true, avatarUrl: true, city: true, createdAt: true },
    });
    if (!user) throw new AppError('User not found', 404);
    sendSuccess(res, user, 'Profile fetched');
  } catch (err) { next(err); }
};

/** PATCH /api/auth/me */
export const updateMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, city, avatarUrl } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { name, city, avatarUrl },
      select: { id: true, name: true, email: true, phone: true, role: true, city: true, avatarUrl: true },
    });
    sendSuccess(res, user, 'Profile updated');
  } catch (err) { next(err); }
};
