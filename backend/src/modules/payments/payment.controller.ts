import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { sendSuccess, sendError } from '../../utils/response';
import { AppError } from '../../middleware/errorHandler';
import { AuthRequest } from '../../middleware/authenticate';
import { sendBookingConfirmationEmail } from '../auth/auth.service';
import { unlockAllUserSeats } from '../../config/redis';

// Mock payment processor
const processMockPayment = async (amount: number, method: string): Promise<{ success: boolean; gatewayPaymentId: string; message: string }> => {
  // Simulate payment processing delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Mock: 95% success rate
  const success = Math.random() > 0.05;
  return {
    success,
    gatewayPaymentId: `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    message: success ? 'Payment successful' : 'Payment declined by bank',
  };
};

// ─── POST /api/payments/initiate ─────────────────────────────────────────────
export const initiatePayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { bookingId, method } = req.body;
    const userId = req.user!.userId;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { show: true },
    });

    if (!booking) throw new AppError('Booking not found', 404);
    if (booking.userId !== userId) throw new AppError('Access denied', 403);
    if (booking.status !== 'PENDING') throw new AppError('Booking is not in pending state', 400);
    if (booking.expiresAt && booking.expiresAt < new Date()) {
      await prisma.booking.update({ where: { id: bookingId }, data: { status: 'EXPIRED' } });
      throw new AppError('Booking has expired. Please start over.', 410);
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        userId,
        amount: booking.totalAmount,
        method: method || 'MOCK',
        status: 'PENDING',
        gatewayOrderId: `ORDER_${Date.now()}`,
      },
    });

    sendSuccess(res, {
      paymentId: payment.id,
      orderId: payment.gatewayOrderId,
      amount: booking.totalAmount,
      currency: 'INR',
    }, 'Payment initiated');
  } catch (err) { next(err); }
};

// ─── POST /api/payments/confirm ───────────────────────────────────────────────
export const confirmPayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { paymentId, method } = req.body;
    const userId = req.user!.userId;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: { include: { bookingItems: true, user: true, show: { include: { movie: true, screen: { include: { theatre: true } } } } } } },
    });

    if (!payment) throw new AppError('Payment not found', 404);
    if (payment.userId !== userId) throw new AppError('Access denied', 403);

    // Process payment
    const result = await processMockPayment(payment.amount, method || 'MOCK');

    if (result.success) {
      // Confirm booking and payment atomically
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: paymentId },
          data: { status: 'SUCCESS', gatewayPaymentId: result.gatewayPaymentId },
        }),
        prisma.booking.update({
          where: { id: payment.bookingId },
          data: { status: 'CONFIRMED', confirmedAt: new Date() },
        }),
      ]);

      // Release seat locks (now officially booked)
      const seatIds = payment.booking.bookingItems.map(bi => bi.seatId);
      await unlockAllUserSeats(payment.booking.showId, seatIds, userId);

      // Send confirmation email (non-blocking)
      sendBookingConfirmationEmail(
        payment.booking.user.email,
        payment.booking.user.name,
        {
          bookingRef: payment.booking.bookingRef,
          movieTitle: payment.booking.show.movie.title,
          theatreName: payment.booking.show.screen.theatre.name,
          showTime: payment.booking.show.startTime.toLocaleString('en-IN'),
          seats: payment.booking.bookingItems.map(bi => bi.seatCode),
          totalAmount: payment.amount,
        }
      ).catch(() => {}); // Non-blocking

      sendSuccess(res, {
        bookingRef: payment.booking.bookingRef,
        status: 'CONFIRMED',
      }, 'Payment successful! Booking confirmed.');
    } else {
      // Payment failed — release seat locks
      const seatIds = payment.booking.bookingItems.map(bi => bi.seatId);
      await unlockAllUserSeats(payment.booking.showId, seatIds, userId);

      await prisma.$transaction([
        prisma.payment.update({
          where: { id: paymentId },
          data: { status: 'FAILED', failureReason: result.message },
        }),
        prisma.booking.update({
          where: { id: payment.bookingId },
          data: { status: 'CANCELLED', cancelReason: 'Payment failed' },
        }),
      ]);

      sendError(res, `Payment failed: ${result.message}`, 402, { canRetry: false });
    }
  } catch (err) { next(err); }
};

// ─── GET /api/payments/:bookingId ─────────────────────────────────────────────
export const getPaymentStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { bookingId: req.params.bookingId },
      include: { booking: { select: { bookingRef: true, status: true } } },
    });
    if (!payment) throw new AppError('Payment not found', 404);
    if (payment.userId !== req.user!.userId) throw new AppError('Access denied', 403);
    sendSuccess(res, payment, 'Payment status fetched');
  } catch (err) { next(err); }
};
