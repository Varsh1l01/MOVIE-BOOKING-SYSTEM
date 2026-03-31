import { Request, Response, NextFunction } from 'express';
import { body, query } from 'express-validator';
import slugify from 'slugify';
import { prisma } from '../../config/database';
import { getCache, setCache, deleteCache, deleteCacheByPrefix } from '../../config/redis';
import { sendSuccess, sendPaginated, sendError } from '../../utils/response';
import { AppError } from '../../middleware/errorHandler';
import { AuthRequest } from '../../middleware/authenticate';
import { MovieStatus } from '@prisma/client';

// ─── Validators ─────────────────────────────────────────────────────────────
export const movieValidators = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('posterUrl').isURL().withMessage('Valid poster URL required'),
  body('genre').isArray({ min: 1 }).withMessage('At least one genre is required'),
  body('language').isArray({ min: 1 }).withMessage('At least one language is required'),
  body('duration').isInt({ min: 1 }).withMessage('Duration in minutes is required'),
  body('releaseDate').isISO8601().withMessage('Valid release date is required'),
];

// ─── GET /api/movies ─────────────────────────────────────────────────────────
export const getMovies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 12);
    const skip = (page - 1) * limit;
    const status = req.query.status as MovieStatus | undefined;
    const genre = req.query.genre as string | undefined;
    const language = req.query.language as string | undefined;
    const search = req.query.search as string | undefined;

    const cacheKey = `movies:${JSON.stringify(req.query)}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const where: any = {};
    if (status) where.status = status;
    if (genre) where.genre = { has: genre };
    if (language) where.language = { has: language };
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const [movies, total] = await prisma.$transaction([
      prisma.movie.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ status: 'asc' }, { releaseDate: 'desc' }],
        select: {
          id: true, title: true, slug: true, posterUrl: true, bannerUrl: true,
          genre: true, language: true, duration: true, releaseDate: true,
          rating: true, status: true, certification: true,
        },
      }),
      prisma.movie.count({ where }),
    ]);

    const result = { success: true, message: 'Movies fetched', data: movies, pagination: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 } };
    await setCache(cacheKey, result, 60);
    res.json(result);
  } catch (err) { next(err); }
};

// ─── GET /api/movies/:slug ────────────────────────────────────────────────────
export const getMovieBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug } = req.params;
    const cacheKey = `movie:${slug}`;
    const cached = await getCache(cacheKey);
    if (cached) { res.json({ success: true, data: cached }); return; }

    const movie = await prisma.movie.findUnique({
      where: { slug },
      include: {
        shows: {
          where: { startTime: { gte: new Date() }, status: 'ACTIVE' },
          include: { screen: { include: { theatre: true } } },
          orderBy: { startTime: 'asc' },
          take: 20,
        },
      },
    });

    if (!movie) throw new AppError('Movie not found', 404);
    await setCache(cacheKey, movie, 120);
    sendSuccess(res, movie, 'Movie fetched');
  } catch (err) { next(err); }
};

// ─── POST /api/movies (Admin) ─────────────────────────────────────────────────
export const createMovie = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, ...rest } = req.body;
    const slug = slugify(title, { lower: true, strict: true }) + '-' + Date.now();
    const movie = await prisma.movie.create({ data: { title, slug, ...rest } });
    await deleteCacheByPrefix('movies:');
    sendSuccess(res, movie, 'Movie created', 201);
  } catch (err) { next(err); }
};

// ─── PUT /api/movies/:id (Admin) ──────────────────────────────────────────────
export const updateMovie = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const movie = await prisma.movie.update({
      where: { id: req.params.id },
      data: req.body,
    });
    await deleteCacheByPrefix('movies:');
    await deleteCache(`movie:${movie.slug}`);
    sendSuccess(res, movie, 'Movie updated');
  } catch (err) { next(err); }
};

// ─── DELETE /api/movies/:id (Admin) ───────────────────────────────────────────
export const deleteMovie = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.movie.delete({ where: { id: req.params.id } });
    await deleteCacheByPrefix('movies:');
    sendSuccess(res, null, 'Movie deleted');
  } catch (err) { next(err); }
};

// ─── GET /api/movies/genres ───────────────────────────────────────────────────
export const getGenres = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const movies = await prisma.movie.findMany({ select: { genre: true } });
    const genres = [...new Set(movies.flatMap(m => m.genre))].sort();
    sendSuccess(res, genres, 'Genres fetched');
  } catch (err) { next(err); }
};
