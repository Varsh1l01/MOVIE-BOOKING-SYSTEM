import Redis from 'ioredis';
import { logger } from '../utils/logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisClient = new Redis(redisUrl, {
  lazyConnect: true,
  retryStrategy: (times) => {
    if (times > 3) {
      logger.warn('Redis: max retries reached, giving up');
      return null;
    }
    return Math.min(times * 200, 2000);
  },
  enableOfflineQueue: false,
});

redisClient.on('connect', () => logger.info('Redis: connecting...'));
redisClient.on('ready', () => logger.info('Redis: ready'));
redisClient.on('error', (err) => logger.warn('Redis error:', err.message));
redisClient.on('close', () => logger.warn('Redis: connection closed'));

const safeRedis = async <T>(fallback: T, operation: () => Promise<T>): Promise<T> => {
  try {
    return await operation();
  } catch (err: any) {
    logger.warn(`Redis operation failed: ${err?.message || 'unknown error'}`);
    return fallback;
  }
};

// ─── Seat Lock Helpers ──────────────────────────────────────────────────────
const SEAT_LOCK_TTL = Number(process.env.SEAT_LOCK_TTL_SECONDS) || 300; // 5 min

export const lockSeat = async (showId: string, seatId: string, userId: string): Promise<boolean> => {
  const key = `seat_lock:${showId}:${seatId}`;
  return safeRedis(false, async () => {
    const result = await redisClient.set(key, userId, 'EX', SEAT_LOCK_TTL, 'NX');
    return result === 'OK';
  });
};

export const unlockSeat = async (showId: string, seatId: string, userId: string): Promise<boolean> => {
  const key = `seat_lock:${showId}:${seatId}`;
  return safeRedis(false, async () => {
    const owner = await redisClient.get(key);
    if (owner === userId) {
      await redisClient.del(key);
      return true;
    }
    return false;
  });
};

export const isSeatLocked = async (showId: string, seatId: string): Promise<string | null> => {
  const key = `seat_lock:${showId}:${seatId}`;
  return safeRedis<string | null>(null, async () => redisClient.get(key));
};

export const getSeatLockTTL = async (showId: string, seatId: string): Promise<number> => {
  const key = `seat_lock:${showId}:${seatId}`;
  return safeRedis(0, async () => redisClient.ttl(key));
};

export const unlockAllUserSeats = async (showId: string, seatIds: string[], userId: string): Promise<void> => {
  await safeRedis(undefined, async () => {
    const keys = seatIds.map(id => `seat_lock:${showId}:${id}`);
    for (const key of keys) {
      const owner = await redisClient.get(key);
      if (owner === userId) await redisClient.del(key);
    }
    return undefined;
  });
};

// Cache helpers
export const setCache = async (key: string, value: unknown, ttlSeconds = 60): Promise<void> => {
  await safeRedis(undefined, async () => {
    await redisClient.set(`cache:${key}`, JSON.stringify(value), 'EX', ttlSeconds);
    return undefined;
  });
};

export const getCache = async <T>(key: string): Promise<T | null> => {
  return safeRedis<T | null>(null, async () => {
    const val = await redisClient.get(`cache:${key}`);
    return val ? JSON.parse(val) : null;
  });
};

export const deleteCache = async (key: string): Promise<void> => {
  await safeRedis(undefined, async () => {
    await redisClient.del(`cache:${key}`);
    return undefined;
  });
};

export const deleteCacheByPrefix = async (prefix: string): Promise<void> => {
  await safeRedis(undefined, async () => {
    const keys = await redisClient.keys(`cache:${prefix}*`);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
    return undefined;
  });
};
