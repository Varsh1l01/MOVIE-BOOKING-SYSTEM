import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { lockSeat, unlockSeat, isSeatLocked, getSeatLockTTL, unlockAllUserSeats } from '../../config/redis';
import { sendSuccess, sendError } from '../../utils/response';
import { AppError } from '../../middleware/errorHandler';
import { AuthRequest } from '../../middleware/authenticate';
import { SeatType } from '@prisma/client';

// ─── GET /api/seats/show/:showId — Get seats with availability ─────────────
export const getSeatsByShow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { showId } = req.params;

    const show = await prisma.show.findUnique({
      where: { id: showId },
      include: {
        screen: {
          include: {
            seats: {
              where: { isActive: true },
              orderBy: [{ row: 'asc' }, { number: 'asc' }],
            },
          },
        },
        bookingItems: {
          where: { booking: { status: { in: ['CONFIRMED', 'PENDING'] } } },
          select: { seatId: true },
        },
      },
    });

    if (!show) throw new AppError('Show not found', 404);

    const bookedSeatIds = new Set(show.bookingItems.map(bi => bi.seatId));

    // Check Redis locks + compute availability
    const seatsWithStatus = await Promise.all(
      show.screen.seats.map(async (seat) => {
        if (bookedSeatIds.has(seat.id)) {
          return { ...seat, status: 'BOOKED' as const, lockTTL: 0 };
        }
        const lockedBy = await isSeatLocked(showId, seat.id);
        if (lockedBy) {
          const ttl = await getSeatLockTTL(showId, seat.id);
          return { ...seat, status: 'LOCKED' as const, lockTTL: ttl };
        }
        return { ...seat, status: 'AVAILABLE' as const, lockTTL: 0 };
      }),
    );

    // Pricing map
    const pricing: Record<SeatType, number> = {
      REGULAR: show.priceRegular,
      PREMIUM: show.pricePremium,
      RECLINER: show.priceRecliner,
      COUPLE: show.priceCouple,
      ACCESSIBLE: show.priceRegular,
    };

    sendSuccess(res, {
      show: { id: show.id, startTime: show.startTime, format: show.format, language: show.language },
      screen: { id: show.screen.id, name: show.screen.name, type: show.screen.type },
      pricing,
      seats: seatsWithStatus,
    }, 'Seats fetched');
  } catch (err) { next(err); }
};

// ─── POST /api/seats/lock — Lock selected seats ───────────────────────────
export const lockSeats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { showId, seatIds } = req.body;
    const userId = req.user!.userId;

    if (!seatIds || seatIds.length === 0) throw new AppError('No seats selected', 400);
    if (seatIds.length > 10) throw new AppError('Cannot select more than 10 seats at once', 400);

    // Verify seats exist and belong to show's screen
    const show = await prisma.show.findUnique({ where: { id: showId }, select: { screenId: true } });
    if (!show) throw new AppError('Show not found', 404);

    const seats = await prisma.seat.findMany({
      where: { id: { in: seatIds }, screenId: show.screenId, isActive: true },
    });

    if (seats.length !== seatIds.length) throw new AppError('One or more seats are invalid', 400);

    // Check if any seats are already booked
    const bookedItems = await prisma.bookingItem.findMany({
      where: { showId, seatId: { in: seatIds }, booking: { status: { in: ['CONFIRMED', 'PENDING'] } } },
    });
    if (bookedItems.length > 0) {
      throw new AppError('One or more seats are already booked', 409);
    }

    // Attempt to lock all seats atomically
    const lockResults = await Promise.all(
      seatIds.map((seatId: string) => lockSeat(showId, seatId, userId)),
    );

    const failedLocks = seatIds.filter((_: string, i: number) => !lockResults[i]);

    if (failedLocks.length > 0) {
      // Release any successfully acquired locks
      await Promise.all(
        seatIds.filter((_: string, i: number) => lockResults[i]).map((seatId: string) => unlockSeat(showId, seatId, userId)),
      );
      throw new AppError('One or more seats are temporarily reserved by another user. Please select different seats.', 409);
    }

    sendSuccess(res, {
      lockedSeats: seatIds,
      expiresIn: Number(process.env.SEAT_LOCK_TTL_SECONDS) || 300,
    }, 'Seats locked for 5 minutes');
  } catch (err) { next(err); }
};

// ─── POST /api/seats/unlock — Release seat locks ──────────────────────────
export const unlockSeats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { showId, seatIds } = req.body;
    const userId = req.user!.userId;
    await unlockAllUserSeats(showId, seatIds, userId);
    sendSuccess(res, null, 'Seats released');
  } catch (err) { next(err); }
};
