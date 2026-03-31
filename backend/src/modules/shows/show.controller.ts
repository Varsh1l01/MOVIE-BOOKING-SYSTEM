import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../middleware/errorHandler';

export const getShowsByMovie = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { movieId } = req.params;
    const { date, city } = req.query;

    const startOfDay = date ? new Date(date as string) : new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    const shows = await prisma.show.findMany({
      where: {
        movieId,
        status: 'ACTIVE',
        startTime: { gte: startOfDay, lte: endOfDay },
        ...(city ? { screen: { theatre: { city: { equals: city as string, mode: 'insensitive' } } } } : {}),
      },
      include: {
        screen: {
          include: {
            theatre: { select: { id: true, name: true, city: true, address: true, amenities: true } },
          },
        },
        movie: { select: { title: true, duration: true, certification: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    // Group by theatre
    const grouped = shows.reduce((acc: any, show) => {
      const theatreId = show.screen.theatre.id;
      if (!acc[theatreId]) {
        acc[theatreId] = { theatre: show.screen.theatre, shows: [] };
      }
      acc[theatreId].shows.push(show);
      return acc;
    }, {});

    sendSuccess(res, Object.values(grouped), 'Shows fetched');
  } catch (err) { next(err); }
};

export const getShowById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const show = await prisma.show.findUnique({
      where: { id: req.params.id },
      include: {
        movie: true,
        screen: {
          include: {
            theatre: true,
            seats: { orderBy: [{ row: 'asc' }, { number: 'asc' }] },
          },
        },
      },
    });
    if (!show) throw new AppError('Show not found', 404);
    sendSuccess(res, show, 'Show fetched');
  } catch (err) { next(err); }
};

export const createShow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const show = await prisma.show.create({ data: req.body });
    sendSuccess(res, show, 'Show created', 201);
  } catch (err) { next(err); }
};

export const updateShow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const show = await prisma.show.update({ where: { id: req.params.id }, data: req.body });
    sendSuccess(res, show, 'Show updated');
  } catch (err) { next(err); }
};

export const deleteShow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.show.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 'Show deleted');
  } catch (err) { next(err); }
};
