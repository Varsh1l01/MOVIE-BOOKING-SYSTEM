import { hashPassword, comparePassword } from './hash';

describe('hash utilities', () => {
  const plainPassword = 'SecureP@ss123';

  describe('hashPassword', () => {
    it('should return a hashed string different from the original', async () => {
      const hash = await hashPassword(plainPassword);
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(plainPassword);
      expect(hash.length).toBeGreaterThan(20);
    });

    it('should produce different hashes for the same input (salted)', async () => {
      const hash1 = await hashPassword(plainPassword);
      const hash2 = await hashPassword(plainPassword);
      expect(hash1).not.toBe(hash2);
    });

    it('should hash empty string without throwing', async () => {
      const hash = await hashPassword('');
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });
  });

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const hash = await hashPassword(plainPassword);
      const result = await comparePassword(plainPassword, hash);
      expect(result).toBe(true);
    });

    it('should return false for wrong password', async () => {
      const hash = await hashPassword(plainPassword);
      const result = await comparePassword('WrongPassword1!', hash);
      expect(result).toBe(false);
    });

    it('should return false for empty password against valid hash', async () => {
      const hash = await hashPassword(plainPassword);
      const result = await comparePassword('', hash);
      expect(result).toBe(false);
    });

    it('should handle special characters in password', async () => {
      const special = '!@#$%^&*()_+{}|:<>?~`±§';
      const hash = await hashPassword(special);
      expect(await comparePassword(special, hash)).toBe(true);
      expect(await comparePassword('not-special', hash)).toBe(false);
    });

    it('should handle very long passwords', async () => {
      const longPw = 'A'.repeat(200);
      const hash = await hashPassword(longPw);
      expect(await comparePassword(longPw, hash)).toBe(true);
    });
  });
});
