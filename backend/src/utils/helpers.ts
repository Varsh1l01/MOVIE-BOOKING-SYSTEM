import crypto from 'crypto';

/**
 * Generates a unique booking reference like MB-A3X9KL2Q
 */
export const generateBookingRef = (): string => `MB-${alphanumeric()}`;
const alphanumeric = (): string => crypto.randomBytes(6).toString('base64url').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);

/**
 * Generates a 6-digit numeric OTP
 */
export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Get OTP expiry date (default 10 minutes from now)
 */
export const getOtpExpiry = (minutes = 10): Date => {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + minutes);
  return expiry;
};
