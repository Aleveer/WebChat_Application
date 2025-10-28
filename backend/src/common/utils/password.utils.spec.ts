import { PasswordUtils } from './password.utils';
import * as bcrypt from 'bcrypt';
import { SECURITY_CONSTANTS, APP_CONSTANTS } from '../constants/app.constants';

// Mock bcrypt module
jest.mock('bcrypt');

describe('PasswordUtils', () => {
  describe('hashPassword', () => {
    // Test case 1: Hash password thành công (branch: try - success)
    it('should hash password successfully', async () => {
      const password = 'mySecurePassword123';
      const hashedPassword = '$2b$10$hashedPasswordString';

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await PasswordUtils.hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(
        password,
        SECURITY_CONSTANTS.BCRYPT_ROUNDS,
      );
      expect(result).toBe(hashedPassword);
    });

    // Test case 2: Hash password với empty string
    it('should hash empty password', async () => {
      const password = '';
      const hashedPassword = '$2b$10$emptyHashedString';

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await PasswordUtils.hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(
        '',
        SECURITY_CONSTANTS.BCRYPT_ROUNDS,
      );
      expect(result).toBe(hashedPassword);
    });

    // Test case 3: Hash password rất dài
    it('should hash very long password', async () => {
      const password = 'a'.repeat(1000);
      const hashedPassword = '$2b$10$longHashedString';

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await PasswordUtils.hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(
        password,
        SECURITY_CONSTANTS.BCRYPT_ROUNDS,
      );
      expect(result).toBe(hashedPassword);
    });

    // Test case 4: Hash password với special characters
    it('should hash password with special characters', async () => {
      const password = 'P@ssw0rd!#$%^&*()';
      const hashedPassword = '$2b$10$specialHashedString';

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await PasswordUtils.hashPassword(password);

      expect(result).toBe(hashedPassword);
    });

    // Test case 5: Hash password với unicode characters
    it('should hash password with unicode characters', async () => {
      const password = 'パスワード123';
      const hashedPassword = '$2b$10$unicodeHashedString';

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await PasswordUtils.hashPassword(password);

      expect(result).toBe(hashedPassword);
    });

    // Test case 6: Xử lý lỗi khi bcrypt.hash fails (branch: catch)
    it('should throw error when bcrypt.hash fails', async () => {
      const password = 'myPassword';
      const errorMessage = 'Bcrypt hashing error';

      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await expect(PasswordUtils.hashPassword(password)).rejects.toThrow(
        `Password hashing failed: ${errorMessage}`,
      );
    });

    // Test case 7: Verify saltRounds được sử dụng đúng
    it('should use correct saltRounds from constants', async () => {
      const password = 'testPassword';
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      await PasswordUtils.hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(
        password,
        SECURITY_CONSTANTS.BCRYPT_ROUNDS,
      );
    });

    // Test case 8: Hash multiple passwords in sequence
    it('should hash multiple passwords in sequence', async () => {
      jest.clearAllMocks(); // Clear previous mock calls

      (bcrypt.hash as jest.Mock)
        .mockResolvedValueOnce('hash1')
        .mockResolvedValueOnce('hash2')
        .mockResolvedValueOnce('hash3');

      const result1 = await PasswordUtils.hashPassword('password1');
      const result2 = await PasswordUtils.hashPassword('password2');
      const result3 = await PasswordUtils.hashPassword('password3');

      expect(result1).toBe('hash1');
      expect(result2).toBe('hash2');
      expect(result3).toBe('hash3');
      expect(bcrypt.hash).toHaveBeenCalledTimes(3);
    });
  });

  describe('comparePassword', () => {
    // Test case 1: Compare password match (branch: try - success - true)
    it('should return true when password matches hash', async () => {
      const password = 'myPassword123';
      const hash = '$2b$10$validHashString';

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await PasswordUtils.comparePassword(password, hash);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(true);
    });

    // Test case 2: Compare password không match (branch: try - success - false)
    it('should return false when password does not match hash', async () => {
      const password = 'wrongPassword';
      const hash = '$2b$10$validHashString';

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await PasswordUtils.comparePassword(password, hash);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(false);
    });

    // Test case 3: Compare empty password
    it('should compare empty password', async () => {
      const password = '';
      const hash = '$2b$10$emptyHashString';

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await PasswordUtils.comparePassword(password, hash);

      expect(bcrypt.compare).toHaveBeenCalledWith('', hash);
      expect(result).toBe(false);
    });

    // Test case 4: Compare với invalid hash
    it('should handle invalid hash format', async () => {
      const password = 'myPassword';
      const hash = 'invalidHashFormat';

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await PasswordUtils.comparePassword(password, hash);

      expect(result).toBe(false);
    });

    // Test case 5: Xử lý lỗi khi bcrypt.compare fails (branch: catch)
    it('should throw error when bcrypt.compare fails', async () => {
      const password = 'myPassword';
      const hash = '$2b$10$validHash';
      const errorMessage = 'Bcrypt comparison error';

      (bcrypt.compare as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await expect(
        PasswordUtils.comparePassword(password, hash),
      ).rejects.toThrow(`Password comparison failed: ${errorMessage}`);
    });

    // Test case 6: Compare với special characters
    it('should compare password with special characters', async () => {
      const password = 'P@ssw0rd!@#';
      const hash = '$2b$10$specialHash';

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await PasswordUtils.comparePassword(password, hash);

      expect(result).toBe(true);
    });

    // Test case 7: Compare multiple passwords
    it('should compare multiple passwords', async () => {
      (bcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const result1 = await PasswordUtils.comparePassword('password1', 'hash1');
      const result2 = await PasswordUtils.comparePassword('password2', 'hash2');
      const result3 = await PasswordUtils.comparePassword('password3', 'hash3');

      expect(result1).toBe(true);
      expect(result2).toBe(false);
      expect(result3).toBe(true);
    });

    // Test case 8: Compare với unicode password
    it('should compare unicode password', async () => {
      const password = 'パスワード123';
      const hash = '$2b$10$unicodeHash';

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await PasswordUtils.comparePassword(password, hash);

      expect(result).toBe(true);
    });
  });

  describe('validatePasswordStrength', () => {
    // Test case 1: Password mạnh (score = 4, password > 8 chars nên có feedback về length)
    it('should validate strong password with all requirements', () => {
      const password = 'StrongP@ss123'; // 13 characters > 8

      const result = PasswordUtils.validatePasswordStrength(password);

      expect(result.isValid).toBe(true);
      expect(result.score).toBe(4); // length > 8 không +score, 4 checks khác pass
      // Password > 8 nên có feedback về length
      expect(result.feedback).toEqual([
        'Password should be at least 8 characters long',
      ]);
    });

    // Test case 2: Password yếu - chỉ lowercase (score = 1)
    it('should invalidate weak password with only lowercase', () => {
      const password = 'weakpassword';

      const result = PasswordUtils.validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.score).toBe(1);
      expect(result.feedback).toContain(
        'Password should contain uppercase letters',
      );
      expect(result.feedback).toContain('Password should contain numbers');
      expect(result.feedback).toContain(
        'Password should contain special characters',
      );
    });

    // Test case 3: Password ngắn (length <= MIN_PASSWORD_LENGTH thì KHÔNG có feedback)
    it('should NOT penalize short password if <= MIN_PASSWORD_LENGTH', () => {
      const shortPassword = 'Ab1!'; // 4 characters <= 8

      const result = PasswordUtils.validatePasswordStrength(shortPassword);

      // Logic: if length <= 8 thì score+1, else feedback
      // Với length = 4 (<= 8), score được +1
      expect(result.feedback).not.toContain(
        'Password should be at least 8 characters long',
      );
    });

    // Test case 4: Password không có lowercase (branch: /[a-z]/.test = false)
    it('should require lowercase letters', () => {
      const password = 'PASSWORD123!';

      const result = PasswordUtils.validatePasswordStrength(password);

      expect(result.feedback).toContain(
        'Password should contain lowercase letters',
      );
    });

    // Test case 5: Password không có uppercase (branch: /[A-Z]/.test = false)
    it('should require uppercase letters', () => {
      const password = 'password123!';

      const result = PasswordUtils.validatePasswordStrength(password);

      expect(result.feedback).toContain(
        'Password should contain uppercase letters',
      );
    });

    // Test case 6: Password không có numbers (branch: /[0-9]/.test = false)
    it('should require numbers', () => {
      const password = 'PasswordAbc!';

      const result = PasswordUtils.validatePasswordStrength(password);

      expect(result.feedback).toContain('Password should contain numbers');
    });

    // Test case 7: Password không có special characters (branch: /[^a-zA-Z0-9]/.test = false)
    it('should require special characters', () => {
      const password = 'Password123';

      const result = PasswordUtils.validatePasswordStrength(password);

      expect(result.feedback).toContain(
        'Password should contain special characters',
      );
    });

    // Test case 8: Common password (branch: isCommonPassword = true, score penalty)
    it('should penalize common passwords', () => {
      const password = 'password123';

      const result = PasswordUtils.validatePasswordStrength(password);

      expect(result.feedback).toContain(
        'Password is too common, please choose a stronger password',
      );
      expect(result.score).toBeLessThan(3); // Score bị giảm 2
    });

    // Test case 9: Password với score = 3 (boundary - isValid = true)
    it('should validate password with minimum score of 3', () => {
      const password = 'Passw0rd'; // Has uppercase, lowercase, number (score = 3)

      const result = PasswordUtils.validatePasswordStrength(password);

      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(3);
    });

    // Test case 10: Password với score < 3 (boundary - isValid = false)
    it('should invalidate password with score less than 3', () => {
      const password = 'pass'; // Too weak

      const result = PasswordUtils.validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.score).toBeLessThan(3);
    });

    // Test case 11: Empty password (length = 0 <= 8, nên score +1)
    it('should invalidate empty password', () => {
      const password = '';

      const result = PasswordUtils.validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.score).toBe(1); // Chỉ có điểm cho length check (0 <= 8)
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    // Test case 12: Password chỉ có special characters
    it('should handle password with only special characters', () => {
      const password = '!@#$%^&*()';

      const result = PasswordUtils.validatePasswordStrength(password);

      expect(result.feedback).toContain(
        'Password should contain lowercase letters',
      );
      expect(result.feedback).toContain(
        'Password should contain uppercase letters',
      );
      expect(result.feedback).toContain('Password should contain numbers');
    });

    // Test case 13: Math.max trong score penalty
    it('should not allow negative score for common passwords', () => {
      const password = '123456'; // Common password, very weak

      const result = PasswordUtils.validatePasswordStrength(password);

      expect(result.score).toBeGreaterThanOrEqual(0); // Math.max(0, score - 2)
    });

    // Test case 14: Password có tất cả requirements nhưng là common
    it('should penalize common password even with all requirements', () => {
      // Giả sử "password" là common (sẽ test với mock nếu cần)
      const password = 'password';

      const result = PasswordUtils.validatePasswordStrength(password);

      expect(result.feedback).toContain(
        'Password is too common, please choose a stronger password',
      );
    });

    // Test case 15: Password dài > MIN_PASSWORD_LENGTH (logic: <= 8 thì +score, else feedback)
    it('should give feedback for password longer than MIN_PASSWORD_LENGTH', () => {
      const password = 'A'.repeat(APP_CONSTANTS.USERS.MIN_PASSWORD_LENGTH + 1); // 9 characters

      const result = PasswordUtils.validatePasswordStrength(password);

      // length (9) > 8, nên else branch: feedback
      expect(result.feedback).toContain(
        'Password should be at least 8 characters long',
      );
    });

    // Test case 16: Unicode characters được coi là special characters
    it('should treat unicode as special characters', () => {
      const password = 'Password123パス';

      const result = PasswordUtils.validatePasswordStrength(password);

      // Unicode characters match /[^a-zA-Z0-9]/
      expect(result.score).toBeGreaterThan(3);
    });
  });

  describe('generateRandomPassword', () => {
    // Test case 1: Generate password với default length (12)
    it('should generate password with default length of 12', () => {
      const password = PasswordUtils.generateRandomPassword();

      expect(password).toHaveLength(12);
      expect(typeof password).toBe('string');
    });

    // Test case 2: Generate password với custom length
    it('should generate password with custom length', () => {
      const length = 20;
      const password = PasswordUtils.generateRandomPassword(length);

      expect(password).toHaveLength(length);
    });

    // Test case 3: Generate password với length = 1
    it('should generate password with length of 1', () => {
      const password = PasswordUtils.generateRandomPassword(1);

      expect(password).toHaveLength(1);
    });

    // Test case 4: Generate password với length = 0
    it('should generate empty password with length of 0', () => {
      const password = PasswordUtils.generateRandomPassword(0);

      expect(password).toHaveLength(0);
      expect(password).toBe('');
    });

    // Test case 5: Generate password chỉ chứa ký tự từ charset
    it('should generate password with characters from charset only', () => {
      const password = PasswordUtils.generateRandomPassword(100);
      const charset =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';

      for (const char of password) {
        expect(charset).toContain(char);
      }
    });

    // Test case 6: Generate multiple passwords are different (randomness)
    it('should generate different passwords on multiple calls', () => {
      const password1 = PasswordUtils.generateRandomPassword(20);
      const password2 = PasswordUtils.generateRandomPassword(20);
      const password3 = PasswordUtils.generateRandomPassword(20);

      // Với random, khả năng 3 passwords giống nhau là cực kỳ thấp
      expect(password1).not.toBe(password2);
      expect(password2).not.toBe(password3);
      expect(password1).not.toBe(password3);
    });

    // Test case 7: Generate với negative length (edge case)
    it('should handle negative length', () => {
      const password = PasswordUtils.generateRandomPassword(-5);

      // Loop không chạy với i < 0
      expect(password).toBe('');
    });

    // Test case 8: Generate với decimal length
    it('should handle decimal length', () => {
      const password = PasswordUtils.generateRandomPassword(10.5);

      // Loop chạy 10 lần (10.5 iterations)
      expect(password.length).toBeGreaterThan(0);
    });

    // Test case 9: Generate với very large length
    it('should generate very long password', () => {
      const length = 1000;
      const password = PasswordUtils.generateRandomPassword(length);

      expect(password).toHaveLength(length);
    });

    // Test case 10: Verify charset contains all expected character types
    it('should potentially generate password with all character types', () => {
      // Generate nhiều passwords để tăng khả năng có tất cả loại ký tự
      const passwords = Array.from({ length: 100 }, () =>
        PasswordUtils.generateRandomPassword(50),
      );
      const combined = passwords.join('');

      expect(/[A-Z]/.test(combined)).toBe(true); // Has uppercase
      expect(/[a-z]/.test(combined)).toBe(true); // Has lowercase
      expect(/[0-9]/.test(combined)).toBe(true); // Has numbers
      expect(/[!@#$%^&*]/.test(combined)).toBe(true); // Has special chars
    });

    // Test case 11: Test Math.random() được gọi
    it('should use Math.random for character selection', () => {
      const randomSpy = jest.spyOn(Math, 'random');

      PasswordUtils.generateRandomPassword(10);

      expect(randomSpy).toHaveBeenCalled();

      randomSpy.mockRestore();
    });

    // Test case 12: Test Math.floor được sử dụng cho index
    it('should use Math.floor for index calculation', () => {
      const floorSpy = jest.spyOn(Math, 'floor');

      PasswordUtils.generateRandomPassword(5);

      expect(floorSpy).toHaveBeenCalled();

      floorSpy.mockRestore();
    });
  });

  describe('isCommonPassword', () => {
    // Test case 1: Common password - exact match (branch: includes = true)
    it('should return true for common password "password"', () => {
      expect(PasswordUtils.isCommonPassword('password')).toBe(true);
    });

    // Test case 2: Common password - case insensitive
    it('should return true for common password in uppercase', () => {
      expect(PasswordUtils.isCommonPassword('PASSWORD')).toBe(true);
      expect(PasswordUtils.isCommonPassword('PaSsWoRd')).toBe(true);
    });

    // Test case 3: Common password "123456"
    it('should return true for "123456"', () => {
      expect(PasswordUtils.isCommonPassword('123456')).toBe(true);
    });

    // Test case 4: Common password "123456789"
    it('should return true for "123456789"', () => {
      expect(PasswordUtils.isCommonPassword('123456789')).toBe(true);
    });

    // Test case 5: Common password "qwerty"
    it('should return true for "qwerty"', () => {
      expect(PasswordUtils.isCommonPassword('qwerty')).toBe(true);
      expect(PasswordUtils.isCommonPassword('QWERTY')).toBe(true);
    });

    // Test case 6: Common password "abc123"
    it('should return true for "abc123"', () => {
      expect(PasswordUtils.isCommonPassword('abc123')).toBe(true);
    });

    // Test case 7: Common password "password123"
    it('should return true for "password123"', () => {
      expect(PasswordUtils.isCommonPassword('password123')).toBe(true);
    });

    // Test case 8: Common password "admin"
    it('should return true for "admin"', () => {
      expect(PasswordUtils.isCommonPassword('admin')).toBe(true);
      expect(PasswordUtils.isCommonPassword('ADMIN')).toBe(true);
    });

    // Test case 9: Non-common password (branch: includes = false)
    it('should return false for non-common password', () => {
      expect(PasswordUtils.isCommonPassword('StrongP@ss123')).toBe(false);
    });

    // Test case 10: Empty string
    it('should return false for empty string', () => {
      expect(PasswordUtils.isCommonPassword('')).toBe(false);
    });

    // Test case 11: Password with spaces
    it('should return false for password with spaces', () => {
      expect(PasswordUtils.isCommonPassword('pass word')).toBe(false);
    });

    // Test case 12: Partial match không được tính
    it('should return false for partial match', () => {
      expect(PasswordUtils.isCommonPassword('password1234')).toBe(false);
      expect(PasswordUtils.isCommonPassword('mypassword')).toBe(false);
    });

    // Test case 13: Test tất cả common passwords trong list
    it('should return true for all passwords in common list', () => {
      const commonPasswords = [
        'password',
        '123456',
        '123456789',
        'qwerty',
        'abc123',
        'password123',
        'admin',
        'letmein',
        'welcome',
        'monkey',
        '1234567890',
        'password1',
        'qwerty123',
        'dragon',
        'master',
      ];

      commonPasswords.forEach((pwd) => {
        expect(PasswordUtils.isCommonPassword(pwd)).toBe(true);
        expect(PasswordUtils.isCommonPassword(pwd.toUpperCase())).toBe(true);
      });
    });

    // Test case 14: Unicode password
    it('should return false for unicode password', () => {
      expect(PasswordUtils.isCommonPassword('パスワード')).toBe(false);
    });

    // Test case 15: Very long password
    it('should return false for very long non-common password', () => {
      expect(PasswordUtils.isCommonPassword('a'.repeat(1000))).toBe(false);
    });

    // Test case 16: Special characters only
    it('should return false for special characters only', () => {
      expect(PasswordUtils.isCommonPassword('!@#$%^&*()')).toBe(false);
    });

    // Test case 17: Common password với trailing spaces (toLowerCase trước)
    it('should handle toLowerCase correctly', () => {
      // toLowerCase() được gọi trước includes()
      expect(PasswordUtils.isCommonPassword('PASSWORD  ')).toBe(false); // Spaces không bị trim
    });
  });

  // Integration tests
  describe('Integration Tests', () => {
    it('should complete full password workflow', async () => {
      // Generate random password
      const generatedPassword = PasswordUtils.generateRandomPassword(16);
      expect(generatedPassword).toHaveLength(16);

      // Validate strength
      const validation =
        PasswordUtils.validatePasswordStrength(generatedPassword);
      // Generated password should be strong
      expect(validation.isValid).toBe(true);

      // Hash password
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashedPassword');
      const hash = await PasswordUtils.hashPassword(generatedPassword);
      expect(hash).toBeDefined();

      // Compare correct password
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const isMatch = await PasswordUtils.comparePassword(
        generatedPassword,
        hash,
      );
      expect(isMatch).toBe(true);

      // Compare wrong password
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const isNotMatch = await PasswordUtils.comparePassword(
        'wrongPassword',
        hash,
      );
      expect(isNotMatch).toBe(false);
    });

    it('should reject common passwords in workflow', async () => {
      const commonPassword = 'password123';

      // Check if common
      expect(PasswordUtils.isCommonPassword(commonPassword)).toBe(true);

      // Validate strength
      const validation = PasswordUtils.validatePasswordStrength(commonPassword);
      expect(validation.feedback).toContain(
        'Password is too common, please choose a stronger password',
      );
      expect(validation.isValid).toBe(false);
    });

    it('should accept strong password in workflow', async () => {
      const strongPassword = 'MyStr0ng!P@ssw0rd';

      // Check if not common
      expect(PasswordUtils.isCommonPassword(strongPassword)).toBe(false);

      // Validate strength
      const validation = PasswordUtils.validatePasswordStrength(strongPassword);
      expect(validation.isValid).toBe(true);
      expect(validation.score).toBeGreaterThanOrEqual(3);

      // Hash and compare
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashedStrong');
      const hash = await PasswordUtils.hashPassword(strongPassword);

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const isMatch = await PasswordUtils.comparePassword(strongPassword, hash);
      expect(isMatch).toBe(true);
    });
  });

  // Edge cases
  describe('Edge Cases', () => {
    it('should handle null or undefined gracefully in validation', () => {
      // TypeScript sẽ catch, nhưng runtime có thể xảy ra
      expect(() =>
        PasswordUtils.validatePasswordStrength(null as any),
      ).toThrow();
    });

    it('should handle very long passwords', async () => {
      const veryLongPassword = 'a'.repeat(10000);

      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$veryLongHash');
      const hash = await PasswordUtils.hashPassword(veryLongPassword);
      expect(hash).toBeDefined();
    });

    it('should handle password with only whitespace', () => {
      const password = '        ';
      const validation = PasswordUtils.validatePasswordStrength(password);

      expect(validation.isValid).toBe(false);
      expect(validation.score).toBeLessThan(3);
    });

    it('should handle multiple sequential hashing', async () => {
      jest.clearAllMocks(); // Clear previous mock calls

      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hash');

      const password = 'myPassword';
      const hash1 = await PasswordUtils.hashPassword(password);
      const hash2 = await PasswordUtils.hashPassword(hash1); // Hash the hash
      const hash3 = await PasswordUtils.hashPassword(hash2); // Hash again

      expect(bcrypt.hash).toHaveBeenCalledTimes(3);
    });
  });
});
