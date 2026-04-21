import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../middleware/errorHandler';
import { AuthRequest } from '../../middleware/authenticate';

// ─────────────────────────────────────────────────────────────────────────────
// SHARED HELPER — validates a coupon and returns the discount amount
// ─────────────────────────────────────────────────────────────────────────────
export const computeDiscount = (
  coupon: {
    type: string;
    value: number;
    maxDiscount: number | null;
    minOrderAmount: number;
    usageLimit: number;
    usedCount: number;
    isActive: boolean;
    validFrom: Date;
    validUntil: Date;
  },
  orderAmount: number,
): number => {
  const now = new Date();
  if (!coupon.isActive)                         throw new AppError('Coupon is disabled',                 400);
  if (now < coupon.validFrom)                   throw new AppError('Coupon is not yet active',           400);
  if (now > coupon.validUntil)                  throw new AppError('Coupon has expired',                 400);
  if (orderAmount < coupon.minOrderAmount)       throw new AppError(`Minimum order ₹${coupon.minOrderAmount} required`, 400);
  if (coupon.usedCount >= coupon.usageLimit)     throw new AppError('Coupon usage limit reached',        400);

  if (coupon.type === 'PERCENTAGE') {
    if (coupon.value > 100) throw new AppError('Invalid percentage value', 400);
    const raw = (orderAmount * coupon.value) / 100;
    return coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw;
  }

  // FLAT
  if (coupon.value > orderAmount) throw new AppError('Flat discount cannot exceed order amount', 400);
  return coupon.value;
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Create coupon  POST /admin/coupons
// ─────────────────────────────────────────────────────────────────────────────
export const createCoupon = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      code, description, type, value,
      minOrderAmount, maxDiscount,
      usageLimit, perUserLimit,
      validFrom, validUntil,
      isActive, applicableGenres,
    } = req.body;

    // Validation
    if (!code || !type || value === undefined || !validFrom || !validUntil)
      throw new AppError('code, type, value, validFrom and validUntil are required', 400);
    if (!['PERCENTAGE', 'FLAT'].includes(type))
      throw new AppError('type must be PERCENTAGE or FLAT', 400);
    if (type === 'PERCENTAGE' && (value <= 0 || value > 100))
      throw new AppError('Percentage value must be 1–100', 400);
    if (type === 'FLAT' && value <= 0)
      throw new AppError('Flat value must be greater than 0', 400);
    if (new Date(validFrom) >= new Date(validUntil))
      throw new AppError('validFrom must be before validUntil', 400);

    // Duplicate check
    const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (existing) throw new AppError(`Coupon code "${code.toUpperCase()}" already exists`, 409);

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase().trim(),
        description: description || '',
        type,
        value,
        minOrderAmount:  minOrderAmount  ?? 0,
        maxDiscount:     maxDiscount     ?? null,
        usageLimit:      usageLimit      ?? 100,
        perUserLimit:    perUserLimit    ?? 1,
        validFrom:       new Date(validFrom),
        validUntil:      new Date(validUntil),
        isActive:        isActive !== undefined ? isActive : true,
        applicableGenres: applicableGenres ?? [],
      },
    });

    sendSuccess(res, coupon, 'Coupon created successfully', 201);
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: List all coupons  GET /admin/coupons
// ─────────────────────────────────────────────────────────────────────────────
export const getAllCoupons = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.query; // ?status=active | expired | all
    const now = new Date();

    let where: any = {};
    if (status === 'active')   where = { isActive: true,  validUntil: { gte: now } };
    if (status === 'expired')  where = { validUntil: { lt: now } };
    if (status === 'inactive') where = { isActive: false };

    const coupons = await prisma.coupon.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { bookings: true } } },
    });

    // Annotate with effective status
    const annotated = coupons.map(c => ({
      ...c,
      isExpired:   now > c.validUntil,
      usageLeft:   Math.max(0, c.usageLimit - c.usedCount),
      effectivelyActive: c.isActive && now >= c.validFrom && now <= c.validUntil && c.usedCount < c.usageLimit,
    }));

    sendSuccess(res, annotated, 'Coupons fetched');
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Get single coupon  GET /admin/coupons/:id
// ─────────────────────────────────────────────────────────────────────────────
export const getCouponById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const coupon = await prisma.coupon.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { bookings: true } } },
    });
    if (!coupon) throw new AppError('Coupon not found', 404);

    const now = new Date();
    sendSuccess(res, {
      ...coupon,
      isExpired: now > coupon.validUntil,
      usageLeft: Math.max(0, coupon.usageLimit - coupon.usedCount),
      effectivelyActive: coupon.isActive && now >= coupon.validFrom && now <= coupon.validUntil && coupon.usedCount < coupon.usageLimit,
    }, 'Coupon fetched');
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Toggle activate / deactivate  PATCH /admin/coupons/:id
// ─────────────────────────────────────────────────────────────────────────────
export const toggleCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const coupon = await prisma.coupon.findUnique({ where: { id: req.params.id } });
    if (!coupon) throw new AppError('Coupon not found', 404);

    const updated = await prisma.coupon.update({
      where: { id: req.params.id },
      data: { isActive: !coupon.isActive },
    });

    sendSuccess(res, updated, `Coupon ${updated.isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Update coupon  PUT /admin/coupons/:id
// ─────────────────────────────────────────────────────────────────────────────
export const updateCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const coupon = await prisma.coupon.findUnique({ where: { id: req.params.id } });
    if (!coupon) throw new AppError('Coupon not found', 404);

    const { type, value, validFrom, validUntil } = req.body;

    if (type && !['PERCENTAGE', 'FLAT'].includes(type))
      throw new AppError('type must be PERCENTAGE or FLAT', 400);
    if (type === 'PERCENTAGE' && value !== undefined && (value <= 0 || value > 100))
      throw new AppError('Percentage value must be 1–100', 400);
    if (validFrom && validUntil && new Date(validFrom) >= new Date(validUntil))
      throw new AppError('validFrom must be before validUntil', 400);

    const updateData: any = { ...req.body };
    if (updateData.code) updateData.code = updateData.code.toUpperCase().trim();
    if (updateData.validFrom) updateData.validFrom = new Date(updateData.validFrom);
    if (updateData.validUntil) updateData.validUntil = new Date(updateData.validUntil);
    // Prevent changing usedCount via API
    delete updateData.usedCount;

    const updated = await prisma.coupon.update({ where: { id: req.params.id }, data: updateData });
    sendSuccess(res, updated, 'Coupon updated successfully');
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Delete coupon  DELETE /admin/coupons/:id
// ─────────────────────────────────────────────────────────────────────────────
export const deleteCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const coupon = await prisma.coupon.findUnique({ where: { id: req.params.id } });
    if (!coupon) throw new AppError('Coupon not found', 404);

    // Soft check — warn if coupon has been used
    if (coupon.usedCount > 0) {
      // Hard delete is fine — Booking keeps couponId for historical reference
      // But we detach first to prevent FK violations
      await prisma.booking.updateMany({
        where: { couponId: req.params.id },
        data: { couponId: null },
      });
    }

    await prisma.coupon.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 'Coupon deleted successfully');
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// USER: Apply / Validate coupon  POST /coupons/apply
// ─────────────────────────────────────────────────────────────────────────────
export const applyCoupon = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code, orderAmount } = req.body;
    const userId = req.user!.id;

    if (!code)        throw new AppError('Coupon code is required', 400);
    if (!orderAmount) throw new AppError('orderAmount is required', 400);
    if (typeof orderAmount !== 'number' || orderAmount <= 0)
      throw new AppError('orderAmount must be a positive number', 400);

    // Fetch coupon
    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase().trim() } });
    if (!coupon) throw new AppError('Invalid coupon code', 404);

    // Check per-user usage limit
    const userUsage = await prisma.booking.count({
      where: { userId, couponId: coupon.id, status: { in: ['CONFIRMED', 'PENDING'] } },
    });
    if (userUsage >= coupon.perUserLimit) {
      throw new AppError(`You have already used this coupon ${coupon.perUserLimit} time(s)`, 400);
    }

    // Compute discount (throws on any validation failure)
    const discount = computeDiscount(coupon, orderAmount);
    const finalAmount = Math.max(0, orderAmount - discount);

    sendSuccess(res, {
      couponId:    coupon.id,
      code:        coupon.code,
      type:        coupon.type,
      value:       coupon.value,
      description: coupon.description,
      discount:    Math.round(discount * 100) / 100,   // 2 decimal places
      orderAmount,
      finalAmount: Math.round(finalAmount * 100) / 100,
      savedText:   `You save ₹${Math.round(discount * 100) / 100}`,
    }, 'Coupon applied successfully');
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// USER: Browse active coupons  GET /coupons
// ─────────────────────────────────────────────────────────────────────────────
export const getActiveCoupons = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const now = new Date();
    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        validFrom:  { lte: now },
        validUntil: { gte: now },
      },
      select: {
        id: true, code: true, description: true, type: true,
        value: true, minOrderAmount: true, maxDiscount: true,
        validUntil: true, applicableGenres: true,
        usedCount: true, usageLimit: true,
      },
      orderBy: { validUntil: 'asc' },
    });

    // Filter out exhausted coupons client-side
    const available = coupons.filter(c => c.usedCount < c.usageLimit);

    sendSuccess(res, available, 'Active coupons fetched');
  } catch (err) { next(err); }
};
