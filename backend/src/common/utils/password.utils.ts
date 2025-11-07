import { hash, verify } from '@node-rs/bcrypt';
import { SECURITY_CONSTANTS, APP_CONSTANTS } from '../constants/app.constants';
export class PasswordUtils {
  /**
   * Hash password using bcrypt (recommended method)
   * @param password - Plain text password
   * @returns Promise<string> - Hashed password
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      const saltRounds = SECURITY_CONSTANTS.BCRYPT_ROUNDS;
      return await hash(password, saltRounds);
    } catch (error) {
      throw new Error(`Password hashing failed: ${error.message}`);
    }
  }

  /**
   * Compare password with bcrypt hash
   * @param password - Plain text password
   * @param hash - Bcrypt hash
   * @returns Promise<boolean> - True if passwords match
   */
  static async comparePassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    try {
      return await verify(password, hash);
    } catch (error) {
      throw new Error(`Password comparison failed: ${error.message}`);
    }
  }

  /**
   * Kiểm tra độ mạnh của password
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // Length check - Awards points for LONG passwords, not short ones
    if (password.length >= APP_CONSTANTS.USERS.MIN_PASSWORD_LENGTH) {
      score += 1;
      // Bonus points for longer passwords
      if (password.length >= 12) score += 1;
      if (password.length >= 16) score += 1;
    } else {
      feedback.push(
        `Password should be at least ${APP_CONSTANTS.USERS.MIN_PASSWORD_LENGTH} characters long`,
      );
    }

    // Lowercase check
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Password should contain lowercase letters');

    // Uppercase check
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Password should contain uppercase letters');

    // Number check
    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Password should contain numbers');

    // Special character check
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    else feedback.push('Password should contain special characters');

    // Common password check
    if (this.isCommonPassword(password)) {
      feedback.push(
        'Password is too common, please choose a stronger password',
      );
      score = Math.max(0, score - 2);
    }

    return {
      isValid: score >= 3,
      score,
      feedback,
    };
  }

  /**
   * Generate a random password
   * @param length - Length of the password (default: 12)
   * @returns Generated password
   */
  static generateRandomPassword(length: number = 12): string {
    const charset =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';

    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return password;
  }

  /**
   * Check if password is common/weak
   * @param password - Password to check
   * @returns boolean - True if password is common
   */
  static isCommonPassword(password: string): boolean {
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

    return commonPasswords.includes(password.toLowerCase());
  }
}
