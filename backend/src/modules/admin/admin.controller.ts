import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { sendSuccess } from '../../utils/response';
import { syncMovies as syncMoviesFromTmdb } from '../../services/movieSync.service';

// ─── GET /api/admin/dashboard ─────────────────────────────────────────────────
export const getDashboardStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [
      totalUsers, totalMovies, totalBookings, totalRevenue,
      recentBookings, topMovies, bookingsByStatus,
    ] = await prisma.$transaction([
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.movie.count(),
      prisma.booking.count({ where: { status: { in: ['CONFIRMED', 'REFUNDED'] } } }),
      prisma.payment.aggregate({ where: { status: 'SUCCESS' }, _sum: { amount: true } }),
      prisma.booking.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          show: { include: { movie: { select: { title: true } } } },
          payment: { select: { status: true, amount: true } },
        },
      }),
      prisma.movie.findMany({
        select: {
          id: true, title: true, posterUrl: true, rating: true,
          _count: { select: { shows: true } },
        },
        orderBy: { rating: 'desc' },
        take: 5,
      }),
      prisma.booking.groupBy({
        by: ['status'],
        orderBy: { status: 'asc' },
        _count: { status: true },
      }),
    ]);

    // Revenue by day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const revenueByDay = await prisma.payment.findMany({
      where: { status: 'SUCCESS', createdAt: { gte: sevenDaysAgo } },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    sendSuccess(res, {
      stats: {
        totalUsers,
        totalMovies,
        totalBookings,
        totalRevenue: totalRevenue._sum.amount || 0,
      },
      recentBookings,
      topMovies,
      bookingsByStatus,
      revenueByDay,
    }, 'Dashboard stats fetched');
  } catch (err) { next(err); }
};

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
export const getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const search = req.query.search as string;

    const where = search
      ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { email: { contains: search, mode: 'insensitive' as const } }] }
      : {};

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, isVerified: true, createdAt: true, _count: { select: { bookings: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ success: true, data: users, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

// ─── GET /api/admin/bookings ──────────────────────────────────────────────────
export const getAllBookings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const status = req.query.status as string;

    const [bookings, total] = await prisma.$transaction([
      prisma.booking.findMany({
        where: status ? { status: status as any } : {},
        include: {
          user: { select: { name: true, email: true } },
          show: { include: { movie: { select: { title: true } }, screen: { include: { theatre: { select: { name: true } } } } } },
          payment: { select: { status: true, amount: true, method: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.booking.count({ where: status ? { status: status as any } : {} }),
    ]);

    res.json({ success: true, data: bookings, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

// ─── PATCH /api/admin/users/:id/toggle-active ─────────────────────────────────
export const toggleUserActive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    const updated = await prisma.user.update({ where: { id: req.params.id }, data: { isActive: !user.isActive } });
    sendSuccess(res, { isActive: updated.isActive }, `User ${updated.isActive ? 'activated' : 'deactivated'}`);
  } catch (err) { next(err); }
};
// ─── POST /api/admin/sync-movies ──────────────────────────────────────────────
export const syncMovies = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const syncedCount = await syncMoviesFromTmdb();
    sendSuccess(res, { syncedCount }, `Successfully synced ${syncedCount} movies from TMDB`);
  } catch (err) { next(err); }
};
