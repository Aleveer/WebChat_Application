import * as crypto from 'crypto';

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
}
