import { computeDiscount } from './coupon.controller';

// Mock database (not used by computeDiscount, but imported at module level)
jest.mock('../../config/database', () => ({
  prisma: {},
}));

const baseCoupon = (overrides: Partial<Parameters<typeof computeDiscount>[0]> = {}) => ({
  type: 'PERCENTAGE' as string,
  value: 20,
  maxDiscount: null as number | null,
  minOrderAmount: 0,
  usageLimit: 100,
  usedCount: 0,
  isActive: true,
  validFrom: new Date(Date.now() - 86400000),   // yesterday
  validUntil: new Date(Date.now() + 86400000),   // tomorrow
  ...overrides,
});

describe('computeDiscount', () => {
  // ─── PERCENTAGE TYPE ─────────────────────────────────────────────────────────
  describe('PERCENTAGE discount', () => {
    it('should calculate correct percentage discount', () => {
      const coupon = baseCoupon({ type: 'PERCENTAGE', value: 20 });
      expect(computeDiscount(coupon, 500)).toBe(100); // 20% of 500
    });

    it('should cap discount at maxDiscount when set', () => {
      const coupon = baseCoupon({ type: 'PERCENTAGE', value: 50, maxDiscount: 75 });
      expect(computeDiscount(coupon, 500)).toBe(75); // 50% of 500 = 250, capped at 75
    });

    it('should return raw discount when below maxDiscount', () => {
      const coupon = baseCoupon({ type: 'PERCENTAGE', value: 10, maxDiscount: 200 });
      expect(computeDiscount(coupon, 500)).toBe(50); // 10% of 500 = 50, below 200 cap
    });

    it('should handle 100% discount', () => {
      const coupon = baseCoupon({ type: 'PERCENTAGE', value: 100 });
      expect(computeDiscount(coupon, 500)).toBe(500);
    });

    it('should handle small order amounts', () => {
      const coupon = baseCoupon({ type: 'PERCENTAGE', value: 10 });
      expect(computeDiscount(coupon, 1)).toBe(0.1);
    });

    it('should throw if percentage > 100', () => {
      const coupon = baseCoupon({ type: 'PERCENTAGE', value: 150 });
      expect(() => computeDiscount(coupon, 500)).toThrow('Invalid percentage value');
    });
  });

  // ─── FLAT TYPE ──────────────────────────────────────────────────────────────
  describe('FLAT discount', () => {
    it('should return exact flat value', () => {
      const coupon = baseCoupon({ type: 'FLAT', value: 100 });
      expect(computeDiscount(coupon, 500)).toBe(100);
    });

    it('should throw when flat value exceeds order amount', () => {
      const coupon = baseCoupon({ type: 'FLAT', value: 600 });
      expect(() => computeDiscount(coupon, 500)).toThrow('Flat discount cannot exceed order amount');
    });

    it('should allow flat value equal to order amount', () => {
      const coupon = baseCoupon({ type: 'FLAT', value: 500 });
      expect(computeDiscount(coupon, 500)).toBe(500);
    });
  });

  // ─── VALIDATION RULES ───────────────────────────────────────────────────────
  describe('validation rules', () => {
    it('should throw when coupon is disabled (isActive = false)', () => {
      const coupon = baseCoupon({ isActive: false });
      expect(() => computeDiscount(coupon, 500)).toThrow('Coupon is disabled');
    });

    it('should throw when coupon is not yet active (validFrom in future)', () => {
      const coupon = baseCoupon({ validFrom: new Date(Date.now() + 86400000) });
      expect(() => computeDiscount(coupon, 500)).toThrow('Coupon is not yet active');
    });

    it('should throw when coupon has expired', () => {
      const coupon = baseCoupon({ validUntil: new Date(Date.now() - 1000) });
      expect(() => computeDiscount(coupon, 500)).toThrow('Coupon has expired');
    });

    it('should throw when order amount < minOrderAmount', () => {
      const coupon = baseCoupon({ minOrderAmount: 300 });
      expect(() => computeDiscount(coupon, 200)).toThrow('Minimum order ₹300 required');
    });

    it('should pass when order amount equals minOrderAmount', () => {
      const coupon = baseCoupon({ minOrderAmount: 300, type: 'PERCENTAGE', value: 10 });
      expect(computeDiscount(coupon, 300)).toBe(30);
    });

    it('should throw when usage limit is reached', () => {
      const coupon = baseCoupon({ usageLimit: 10, usedCount: 10 });
      expect(() => computeDiscount(coupon, 500)).toThrow('Coupon usage limit reached');
    });

    it('should pass when usedCount < usageLimit', () => {
      const coupon = baseCoupon({ usageLimit: 10, usedCount: 9, type: 'FLAT', value: 50 });
      expect(computeDiscount(coupon, 500)).toBe(50);
    });
  });
});
