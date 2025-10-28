import { Types } from 'mongoose';
import { APP_CONSTANTS } from '../constants/app.constants';

export class ValidationUtils {
  static isValidObjectId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }

  static isValidPhoneNumber(phoneNumber: string): boolean {
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
    return (
      password.length >= APP_CONSTANTS.USERS.MIN_PASSWORD_LENGTH &&
      password.length <= APP_CONSTANTS.USERS.MAX_PASSWORD_LENGTH &&
      APP_CONSTANTS.USERS.PASSWORD_REGEX.test(password)
    );
  }

  static isValidName(name: string): boolean {
    return name.length >= 1 && name.length <= 50 && /^[a-zA-Z\s]+$/.test(name);
  }
}
