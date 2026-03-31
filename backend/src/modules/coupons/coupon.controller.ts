import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../middleware/errorHandler';
import { AuthRequest } from '../../middleware/authenticate';

export const getAllCoupons = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const coupons = await prisma.coupon.findMany({
      where: { isActive: true, validUntil: { gte: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    sendSuccess(res, coupons, 'Coupons fetched');
  } catch (err) { next(err); }
};

export const validateCoupon = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code, orderAmount } = req.body;
    const coupon = await prisma.coupon.findUnique({ where: { code } });

    if (!coupon) throw new AppError('Invalid coupon code', 400);
    if (!coupon.isActive) throw new AppError('Coupon is inactive', 400);
    if (new Date() > coupon.validUntil) throw new AppError('Coupon has expired', 400);
    if (new Date() < coupon.validFrom) throw new AppError('Coupon is not yet active', 400);
    if (orderAmount < coupon.minOrderAmount) throw new AppError(`Minimum order of ₹${coupon.minOrderAmount} required`, 400);
    if (coupon.usedCount >= coupon.usageLimit) throw new AppError('Coupon limit reached', 400);

    const discount = coupon.type === 'PERCENTAGE'
      ? Math.min((orderAmount * coupon.value) / 100, coupon.maxDiscount || Infinity)
      : coupon.value;

    sendSuccess(res, { coupon, discount, finalAmount: orderAmount - discount }, 'Coupon is valid');
  } catch (err) { next(err); }
};

export const createCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const coupon = await prisma.coupon.create({ data: req.body });
    sendSuccess(res, coupon, 'Coupon created', 201);
  } catch (err) { next(err); }
};

export const updateCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const coupon = await prisma.coupon.update({ where: { id: req.params.id }, data: req.body });
    sendSuccess(res, coupon, 'Coupon updated');
  } catch (err) { next(err); }
};
export const deleteCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.coupon.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 'Coupon deleted');
  } catch (err) { next(err); }
};

export const getCouponById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const coupon = await prisma.coupon.findUnique({ where: { id: req.params.id } });
    if (!coupon) throw new AppError('Coupon not found', 404);
    sendSuccess(res, coupon, 'Coupon fetched');
  } catch (err) { next(err); }
};
