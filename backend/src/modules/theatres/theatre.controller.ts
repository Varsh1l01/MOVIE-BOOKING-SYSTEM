import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { sendSuccess, sendPaginated } from '../../utils/response';
import { AppError } from '../../middleware/errorHandler';

export const getTheatres = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const city = req.query.city as string;
    const where = city ? { city: { equals: city, mode: 'insensitive' as const }, isActive: true } : { isActive: true };
    const theatres = await prisma.theatre.findMany({
      where,
      include: { screens: { where: { isActive: true }, select: { id: true, name: true, type: true, totalSeats: true } } },
      orderBy: { name: 'asc' },
    });
    sendSuccess(res, theatres, 'Theatres fetched');
  } catch (err) { next(err); }
};

export const getTheatreById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const theatre = await prisma.theatre.findUnique({
      where: { id: req.params.id },
      include: { screens: { include: { seats: { orderBy: [{ row: 'asc' }, { number: 'asc' }] } } } },
    });
    if (!theatre) throw new AppError('Theatre not found', 404);
    sendSuccess(res, theatre, 'Theatre fetched');
  } catch (err) { next(err); }
};

export const createTheatre = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const theatre = await prisma.theatre.create({ data: req.body });
    sendSuccess(res, theatre, 'Theatre created', 201);
  } catch (err) { next(err); }
};

export const updateTheatre = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const theatre = await prisma.theatre.update({ where: { id: req.params.id }, data: req.body });
    sendSuccess(res, theatre, 'Theatre updated');
  } catch (err) { next(err); }
};

export const createScreen = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { theatreId } = req.params;
    const { name, type, totalSeats, rows, seatsPerRow } = req.body;
    
    const screen = await prisma.screen.create({
      data: { theatreId, name, type, totalSeats },
    });

    // Auto-generate seats
    if (rows && seatsPerRow) {
      const seatData = [];
      for (let r = 0; r < rows; r++) {
        const row = String.fromCharCode(65 + r); // A, B, C...
        for (let n = 1; n <= seatsPerRow; n++) {
          const seatType = r < 2 ? 'RECLINER' : r < 4 ? 'PREMIUM' : 'REGULAR';
          seatData.push({ screenId: screen.id, row, number: n, seatCode: `${row}${n}`, type: seatType as any });
        }
      }
      await prisma.seat.createMany({ data: seatData });
    }

    sendSuccess(res, screen, 'Screen created', 201);
  } catch (err) { next(err); }
};

export const deleteTheatre = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.theatre.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 'Theatre deleted');
  } catch (err) { next(err); }
};

export const updateScreen = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const screen = await prisma.screen.update({ where: { id: req.params.id }, data: req.body });
    sendSuccess(res, screen, 'Screen updated');
  } catch (err) { next(err); }
};

export const deleteScreen = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.screen.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 'Screen deleted');
  } catch (err) { next(err); }
};

export const getCities = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const theatres = await prisma.theatre.findMany({ select: { city: true }, distinct: ['city'], orderBy: { city: 'asc' } });
    const cities = theatres.map(t => t.city);
    sendSuccess(res, cities, 'Cities fetched');
  } catch (err) { next(err); }
};
