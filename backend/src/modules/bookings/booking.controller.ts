import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { unlockAllUserSeats, isSeatLocked } from '../../config/redis';
import { sendSuccess, sendPaginated } from '../../utils/response';
import { AppError } from '../../middleware/errorHandler';
import { AuthRequest } from '../../middleware/authenticate';
import { generateBookingRef } from '../../utils/helpers';
import { sendBookingConfirmationEmail } from '../auth/auth.service';
import { SeatType } from '@prisma/client';

// ─── POST /api/bookings — Create booking ─────────────────────────────────────
export const createBooking = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { showId, seatIds, couponCode } = req.body;
    const userId = req.user!.userId;

    // Get show with pricing
    const show = await prisma.show.findUnique({
      where: { id: showId },
      include: { screen: { include: { theatre: true } }, movie: true },
    });
    if (!show) throw new AppError('Show not found', 404);
    if (show.status !== 'ACTIVE') throw new AppError('Show is not available for booking', 400);

    // Get seats
    const seats = await prisma.seat.findMany({ where: { id: { in: seatIds } } });
    if (seats.length !== seatIds.length) throw new AppError('Invalid seat selection', 400);

    // Enforce seat-lock ownership before creating a pending booking.
    // This keeps booking flow consistent: seat selection -> lock -> checkout.
    const lockOwners = await Promise.all(seatIds.map((seatId: string) => isSeatLocked(showId, seatId)));
    const nonOwnedLocks = lockOwners.filter((owner) => owner !== null && owner !== userId);
    if (nonOwnedLocks.length > 0) {
      throw new AppError('One or more seats are locked by another user. Please reselect seats.', 409);
    }

    // Price calculation
    const priceMap: Record<SeatType, number> = {
      REGULAR: show.priceRegular,
      PREMIUM: show.pricePremium,
      RECLINER: show.priceRecliner,
      COUPLE: show.priceCouple,
      ACCESSIBLE: show.priceRegular,
    };
    const subtotal = seats.reduce((sum, s) => sum + priceMap[s.type], 0);
    const convenienceFee = Math.round(subtotal * 0.02); // 2% convenience fee

    // Apply coupon
    let discount = 0;
    let coupon = null;
    if (couponCode) {
      coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
      if (!coupon) throw new AppError('Invalid coupon code', 400);
      if (!coupon.isActive) throw new AppError('Coupon is expired', 400);
      if (new Date() > coupon.validUntil) throw new AppError('Coupon has expired', 400);
      if (new Date() < coupon.validFrom) throw new AppError('Coupon is not yet valid', 400);
      if (subtotal < coupon.minOrderAmount) throw new AppError(`Minimum order amount ₹${coupon.minOrderAmount} required`, 400);
      if (coupon.usedCount >= coupon.usageLimit) throw new AppError('Coupon usage limit reached', 400);

      discount = coupon.type === 'PERCENTAGE'
        ? Math.min((subtotal * coupon.value) / 100, coupon.maxDiscount || Infinity)
        : coupon.value;
    }

    const totalAmount = subtotal + convenienceFee - discount;

    // Create booking + items in transaction (prevents double booking)
    const booking = await prisma.$transaction(async (tx) => {
      // Re-check seats aren't already booked (within transaction for atomicity)
      const existingItems = await tx.bookingItem.findMany({
        where: { showId, seatId: { in: seatIds }, booking: { status: { in: ['CONFIRMED', 'PENDING'] } } },
      });
      if (existingItems.length > 0) {
        throw new AppError('One or more seats have been booked by someone else. Please select different seats.', 409);
      }

      const bookingRef = generateBookingRef();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min to complete payment

      const newBooking = await tx.booking.create({
        data: {
          bookingRef,
          userId,
          showId,
          status: 'PENDING',
          totalSeats: seats.length,
          subtotal,
          discount,
          convenienceFee,
          totalAmount,
          couponId: coupon?.id,
          expiresAt,
          bookingItems: {
            create: seats.map(seat => ({
              showId,
              seatId: seat.id,
              seatCode: seat.seatCode,
              seatType: seat.type,
              price: priceMap[seat.type],
            })),
          },
        },
        include: { bookingItems: true, show: { include: { movie: true, screen: { include: { theatre: true } } } } },
      });

      // Increment coupon usage
      if (coupon) {
        await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
      }

      return newBooking;
    });

    sendSuccess(res, booking, 'Booking created — complete payment within 10 minutes', 201);
  } catch (err) { next(err); }
};

// ─── GET /api/bookings/my — Get user's bookings ───────────────────────────
export const getMyBookings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(20, Number(req.query.limit) || 10);

    const [bookings, total] = await prisma.$transaction([
      prisma.booking.findMany({
        where: { userId },
        include: {
          bookingItems: { include: { seat: true } },
          show: { include: { movie: { select: { title: true, posterUrl: true, duration: true } }, screen: { include: { theatre: { select: { name: true, city: true } } } } } },
          payment: { select: { status: true, method: true, amount: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.booking.count({ where: { userId } }),
    ]);

    sendPaginated(res, bookings, total, page, limit, 'Bookings fetched');
  } catch (err) { next(err); }
};

// ─── GET /api/bookings/:bookingRef — Get single booking ──────────────────
export const getBookingByRef = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { bookingRef: req.params.bookingRef },
      include: {
        bookingItems: { include: { seat: true } },
        show: { include: { movie: true, screen: { include: { theatre: true } } } },
        payment: true,
        user: { select: { name: true, email: true, phone: true } },
      },
    });

    if (!booking) throw new AppError('Booking not found', 404);
    if (booking.userId !== req.user!.userId && !['ADMIN', 'SUPER_ADMIN'].includes(req.user!.role)) {
      throw new AppError('Access denied', 403);
    }

    sendSuccess(res, booking, 'Booking fetched');
  } catch (err) { next(err); }
};

// ─── PATCH /api/bookings/:bookingRef/cancel — Cancel booking ─────────────
export const cancelBooking = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { bookingRef: req.params.bookingRef },
      include: { show: true, payment: true, bookingItems: true },
    });

    if (!booking) throw new AppError('Booking not found', 404);
    if (booking.userId !== req.user!.userId) throw new AppError('Access denied', 403);
    if (booking.status !== 'CONFIRMED') throw new AppError('Only confirmed bookings can be cancelled', 400);

    // Check show time (cannot cancel if < 2 hours to show)
    const hoursToShow = (booking.show.startTime.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursToShow < 2) throw new AppError('Cannot cancel booking within 2 hours of show', 400);

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: req.body.reason || 'User requested cancellation' },
      });

      // Initiate refund
      if (booking.payment && booking.payment.status === 'SUCCESS') {
        await tx.payment.update({
          where: { id: booking.payment.id },
          data: { status: 'REFUNDED', refundAmount: booking.totalAmount, refundedAt: new Date() },
        });
        await tx.booking.update({ where: { id: booking.id }, data: { status: 'REFUNDED' } });
      }
    });

    sendSuccess(res, null, 'Booking cancelled and refund initiated');
  } catch (err) { next(err); }
};
