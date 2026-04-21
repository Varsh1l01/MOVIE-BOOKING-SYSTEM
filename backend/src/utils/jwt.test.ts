import jwt from 'jsonwebtoken';
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken, JwtPayload } from './jwt';

const mockPayload: JwtPayload = {
  userId: 'user-123',
  email: 'test@example.com',
  role: 'USER',
};

describe('JWT utilities', () => {
  describe('signAccessToken', () => {
    it('should return a valid JWT string', () => {
      const token = signAccessToken(mockPayload);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // header.payload.signature
    });

    it('should embed correct payload fields', () => {
      const token = signAccessToken(mockPayload);
      const decoded = jwt.decode(token) as any;
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
    });

    it('should set an expiration time', () => {
      const token = signAccessToken(mockPayload);
      const decoded = jwt.decode(token) as any;
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });
  });

  describe('signRefreshToken', () => {
    it('should return a valid JWT string', () => {
      const token = signRefreshToken(mockPayload);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should have a longer expiration than access token', () => {
      const access = jwt.decode(signAccessToken(mockPayload)) as any;
      const refresh = jwt.decode(signRefreshToken(mockPayload)) as any;
      const accessLifetime = access.exp - access.iat;
      const refreshLifetime = refresh.exp - refresh.iat;
      expect(refreshLifetime).toBeGreaterThan(accessLifetime);
    });
  });

  describe('verifyAccessToken', () => {
    it('should return payload for valid token', () => {
      const token = signAccessToken(mockPayload);
      const result = verifyAccessToken(token);
      expect(result.userId).toBe(mockPayload.userId);
      expect(result.email).toBe(mockPayload.email);
      expect(result.role).toBe(mockPayload.role);
    });

    it('should throw for tampered token', () => {
      const token = signAccessToken(mockPayload);
      const tampered = token.slice(0, -5) + 'XXXXX';
      expect(() => verifyAccessToken(tampered)).toThrow();
    });

    it('should throw for token signed with wrong secret', () => {
      const token = jwt.sign(mockPayload, 'wrong-secret', { expiresIn: '15m' });
      expect(() => verifyAccessToken(token)).toThrow();
    });

    it('should throw for expired token', () => {
      const expired = jwt.sign(mockPayload, process.env.JWT_ACCESS_SECRET!, { expiresIn: '0s' });
      // Wait a tiny moment for expiry
      expect(() => verifyAccessToken(expired)).toThrow();
    });

    it('should throw for garbage string', () => {
      expect(() => verifyAccessToken('not-a-jwt')).toThrow();
    });

    it('should throw for empty string', () => {
      expect(() => verifyAccessToken('')).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should return payload for valid token', () => {
      const token = signRefreshToken(mockPayload);
      const result = verifyRefreshToken(token);
      expect(result.userId).toBe(mockPayload.userId);
      expect(result.email).toBe(mockPayload.email);
    });

    it('should throw for token signed with access secret', () => {
      const token = signAccessToken(mockPayload); // signed with access secret
      expect(() => verifyRefreshToken(token)).toThrow(); // needs refresh secret
    });

    it('should throw for expired token', () => {
      const expired = jwt.sign(mockPayload, process.env.JWT_REFRESH_SECRET!, { expiresIn: '0s' });
      expect(() => verifyRefreshToken(expired)).toThrow();
    });
  });
});
