import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import dotenv from 'dotenv';

import { prisma } from './config/database';
import { redisClient } from './config/redis';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import movieRoutes from './modules/movies/movie.routes';
import theatreRoutes from './modules/theatres/theatre.routes';
import showRoutes from './modules/shows/show.routes';
import seatRoutes from './modules/seats/seat.routes';
import bookingRoutes from './modules/bookings/booking.routes';
import paymentRoutes from './modules/payments/payment.routes';
import couponRoutes from './modules/coupons/coupon.routes';
import adminRoutes from './modules/admin/admin.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security Middleware ────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate Limiting ──────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ─── General Middleware ─────────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// ─── Health Check ───────────────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  let dbStatus = 'ok';
  let redisStatus = 'ok';

  try { await prisma.$queryRaw`SELECT 1`; } catch { dbStatus = 'error'; }
  try { await redisClient.ping(); } catch { redisStatus = 'error'; }

  res.json({
    success: true,
    message: 'Movie Booking API is running',
    timestamp: new Date().toISOString(),
    services: { database: dbStatus, redis: redisStatus },
  });
});

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/theatres', theatreRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/seats', seatRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/admin', adminRoutes);

// ─── Error Handling ─────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Server Start ───────────────────────────────────────────────────────────
const server = app.listen(PORT, async () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
  
  try {
    await prisma.$connect();
    logger.info('✅ PostgreSQL connected via Prisma');
  } catch (err) {
    logger.error('❌ Database connection failed:', err);
  }

  try {
    await redisClient.ping();
    logger.info('✅ Redis connected');
  } catch (err) {
    logger.warn('⚠️  Redis not available - seat locking disabled:', err);
  }
});

// ─── Graceful Shutdown ──────────────────────────────────────────────────────
const shutdown = async (signal: string) => {
  logger.info(`${signal} received → shutting down gracefully`);
  server.close(async () => {
    await prisma.$disconnect();
    redisClient.disconnect();
    logger.info('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
