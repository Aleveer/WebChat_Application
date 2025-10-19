import { Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { APP_CONSTANTS } from '../constants/app.constants';
// Validation Utilities
export class ValidationUtils {
  static isValidObjectId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }

  static isValidPhoneNumber(phoneNumber: string): boolean {
    //Call app.constants.ts from src/common/constants/app.constants.ts
    const phoneRegex = APP_CONSTANTS.USERS.PHONE_REGEX;

    return phoneRegex.test(phoneNumber);
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = APP_CONSTANTS.USERS.EMAIL_REGEX;
    return emailRegex.test(email);
  }

  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static isValidImageUrl(url: string): boolean {
    const imageRegex = APP_CONSTANTS.USERS.PROFILE_PHOTO_REGEX;
    return imageRegex.test(url);
  }

  static sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }

  static isValidPassword(password: string): boolean {
    return APP_CONSTANTS.USERS.MIN_PASSWORD_LENGTH < 6;
  }

  static isValidName(name: string): boolean {
    return name.length >= 1 && name.length <= 50 && /^[a-zA-Z\s]+$/.test(name);
  }
}
