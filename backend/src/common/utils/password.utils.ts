import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

export class PasswordUtils {
  /**
   * Tạo salt ngẫu nhiên
   */
  static generateSalt(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Hash password với SHA-256 và salt
   */
  static hashPassword(password: string, salt: string): string {
    return crypto
      .createHash('sha256')
      .update(password + salt)
      .digest('hex');
  }

  /**
   * Tạo salt và hash password
   */
  static hashPasswordWithSalt(password: string): {
    hash: string;
    salt: string;
  } {
    const salt = this.generateSalt();
    const hash = this.hashPassword(password, salt);
    return { hash, salt };
  }

  /**
   * Verify password với hash và salt đã lưu
   */
  static verifyPassword(password: string, hash: string, salt: string): boolean {
    const hashedPassword = this.hashPassword(password, salt);
    return hashedPassword === hash;
  }

  /**
   * So sánh password với hash
   */
  static async comparePassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
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

    if (password.length >= 8) score += 1;
    else feedback.push('Password should be at least 8 characters long');

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Password should contain lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Password should contain uppercase letters');

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Password should contain numbers');

    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    else feedback.push('Password should contain special characters');

    return {
      isValid: score >= 3,
      score,
      feedback,
    };
  }
}
