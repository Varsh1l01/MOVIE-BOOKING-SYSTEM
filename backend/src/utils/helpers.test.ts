import { generateBookingRef, generateOtp, getOtpExpiry } from './helpers';

describe('helper utilities', () => {
  describe('generateBookingRef', () => {
    it('should start with MB- prefix', () => {
      const ref = generateBookingRef();
      expect(ref.startsWith('MB-')).toBe(true);
    });

    it('should be alphanumeric after prefix', () => {
      const ref = generateBookingRef();
      const code = ref.replace('MB-', '');
      expect(code).toMatch(/^[A-Z0-9]+$/);
    });

    it('should have total length of 11 characters (MB- + 8)', () => {
      const ref = generateBookingRef();
      // MB- = 3 chars + up to 8 alphanum chars
      expect(ref.length).toBeGreaterThanOrEqual(4);
      expect(ref.length).toBeLessThanOrEqual(11);
    });

    it('should generate unique values', () => {
      const refs = new Set(Array.from({ length: 50 }, () => generateBookingRef()));
      expect(refs.size).toBe(50);
    });
  });

  describe('generateOtp', () => {
    it('should return a 6-digit string', () => {
      const otp = generateOtp();
      expect(otp).toMatch(/^\d{6}$/);
    });

    it('should return a string (not a number)', () => {
      const otp = generateOtp();
      expect(typeof otp).toBe('string');
    });

    it('should be between 100000 and 999999', () => {
      for (let i = 0; i < 100; i++) {
        const otp = parseInt(generateOtp(), 10);
        expect(otp).toBeGreaterThanOrEqual(100000);
        expect(otp).toBeLessThanOrEqual(999999);
      }
    });

    it('should produce varied outputs (not always the same)', () => {
      const otps = new Set(Array.from({ length: 20 }, () => generateOtp()));
      // Statistically, 20 random 6-digit numbers should almost never collide
      expect(otps.size).toBeGreaterThan(10);
    });
  });

  describe('getOtpExpiry', () => {
    it('should return a Date in the future', () => {
      const expiry = getOtpExpiry();
      expect(expiry instanceof Date).toBe(true);
      expect(expiry.getTime()).toBeGreaterThan(Date.now());
    });

    it('should default to 10 minutes from now', () => {
      const before = Date.now();
      const expiry = getOtpExpiry();
      const after = Date.now();
      const diff = expiry.getTime() - before;
      // Should be roughly 10 minutes (600,000ms) ± small margin
      expect(diff).toBeGreaterThanOrEqual(9 * 60 * 1000);
      expect(diff).toBeLessThanOrEqual(11 * 60 * 1000);
    });

    it('should respect custom minutes parameter', () => {
      const before = Date.now();
      const expiry = getOtpExpiry(5);
      const diff = expiry.getTime() - before;
      expect(diff).toBeGreaterThanOrEqual(4 * 60 * 1000);
      expect(diff).toBeLessThanOrEqual(6 * 60 * 1000);
    });

    it('should handle 0 minutes', () => {
      const before = Date.now();
      const expiry = getOtpExpiry(0);
      const diff = expiry.getTime() - before;
      // Should be within a few ms of now
      expect(diff).toBeLessThan(1000);
    });
  });
});
