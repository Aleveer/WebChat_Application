import { z } from 'zod';

/**
 * Schema để sanitize MongoDB input
 * Loại bỏ các MongoDB operators và ký tự đặc biệt
 */
export const MongoSafeStringSchema = z
  .string()
  .trim()
  .transform((val) => {
    // Loại bỏ MongoDB operators và special characters
    return val
      .replace(/\$/g, '') // Loại bỏ $ signs (MongoDB operators)
      .replace(/\{/g, '') // Loại bỏ { (object notation)
      .replace(/\}/g, '') // Loại bỏ } (object notation)
      .replace(/\[/g, '') // Loại bỏ [ (array notation)
      .replace(/\]/g, '') // Loại bỏ ] (array notation)
      .trim();
  });

/**
 * Schema cho MongoDB ObjectId
 * Validate 24 hex characters
 */
export const MongoObjectIdSchema = z
  .string()
  .trim()
  .length(24, 'ObjectId phải có đúng 24 ký tự')
  .regex(/^[a-fA-F0-9]{24}$/, 'ObjectId không hợp lệ');

/**
 * Schema cho email
 * Validate và chuyển về lowercase
 */
export const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Email không hợp lệ')
  .max(255, 'Email không được vượt quá 255 ký tự');

/**
 * Schema cho số điện thoại quốc tế
 * Format: +[1-9][0-9]{1,14}
 */
export const PhoneNumberSchema = z
  .string()
  .trim()
  .transform((val) => val.replace(/[^\d+]/g, '')) // Loại bỏ tất cả ký tự không phải số và dấu +
  .pipe(
    z
      .string()
      .regex(
        /^\+[1-9]\d{1,14}$/,
        'Số điện thoại không hợp lệ (format: +[1-9][0-9]{1,14})',
      ),
  );

/**
 * Schema cho regex safe string
 * Escape các ký tự đặc biệt để ngăn ReDoS attacks
 */
export const RegexSafeStringSchema = z
  .string()
  .trim()
  .max(100, 'Input quá dài (tối đa 100 ký tự)')
  .transform((val) => {
    // Escape special regex characters
    return val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  });

/**
 * Schema cho username
 * Chỉ cho phép alphanumeric, underscore, và hyphen
 */
export const UsernameSchema = z
  .string()
  .trim()
  .min(3, 'Username phải có ít nhất 3 ký tự')
  .max(30, 'Username không được vượt quá 30 ký tự')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Username chỉ được chứa chữ cái, số, gạch dưới và gạch ngang',
  );

/**
 * Schema cho URL
 * Validate và sanitize URL
 */
export const UrlSchema = z
  .string()
  .trim()
  .url('URL không hợp lệ')
  .max(2000, 'URL không được vượt quá 2000 ký tự');

/**
 * ===========================================
 * UTILITY FUNCTIONS
 * ===========================================
 */

/**
 * Sanitize user input để ngăn MongoDB injection
 *
 * @param input - User input string
 * @returns Sanitized string hoặc error nếu validation thất bại
 */
export function sanitizeMongoInput(input: string): string {
  try {
    return MongoSafeStringSchema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Validation failed: ${error.issues.map((e) => e.message).join(', ')}`,
      );
    }
    throw error;
  }
}

/**
 * Escape special regex characters để ngăn ReDoS attacks
 *
 * @param input - User input string for regex
 * @returns Escaped string safe for regex construction
 */
export function escapeRegexCharacters(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Escape special regex characters
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Tạo safe regex pattern từ user input
 * Kết hợp sanitization và escaping cho safe regex queries
 *
 * @param input - User input string
 * @param flags - Regex flags (mặc định: 'i' cho case-insensitive)
 * @returns Safe RegExp object
 */
export function createSafeRegex(input: string, flags: string = 'i'): RegExp {
  try {
    const sanitizedAndEscaped = RegexSafeStringSchema.parse(input);
    return new RegExp(sanitizedAndEscaped, flags);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Regex validation failed: ${error.issues.map((e) => e.message).join(', ')}`,
      );
    }
    throw error;
  }
}

/**
 * Sanitize object để ngăn MongoDB injection trong query objects
 * Recursively loại bỏ $ operators từ object keys
 *
 * @param obj - Object cần sanitize
 * @returns Sanitized object
 */
export function sanitizeQueryObject<T extends Record<string, any>>(obj: T): T {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const sanitized = {} as T;

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      // Loại bỏ $ từ key names
      const sanitizedKey = key.replace(/^\$/, '') as keyof T;
      const value = obj[key];

      // Recursively sanitize nested objects
      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        sanitized[sanitizedKey] = sanitizeQueryObject(value);
      } else {
        sanitized[sanitizedKey] = value;
      }
    }
  }

  return sanitized;
}

/**
 * Validate và sanitize MongoDB ObjectId
 *
 * @param id - Potential ObjectId string
 * @returns Sanitized ID
 * @throws Error nếu ObjectId không hợp lệ
 */
export function sanitizeObjectId(id: string): string {
  return MongoObjectIdSchema.parse(id);
}

/**
 * Validate và sanitize MongoDB ObjectId (safe version)
 * Trả về null thay vì throw error
 *
 * @param id - Potential ObjectId string
 * @returns Sanitized ID hoặc null nếu invalid
 */
export function sanitizeObjectIdSafe(id: string): string | null {
  const result = MongoObjectIdSchema.safeParse(id);
  return result.success ? result.data : null;
}

/**
 * Sanitize email input
 *
 * @param email - Email string
 * @returns Sanitized email
 * @throws Error nếu email không hợp lệ
 */
export function sanitizeEmail(email: string): string {
  return EmailSchema.parse(email);
}

/**
 * Sanitize email input (safe version)
 * Trả về null thay vì throw error
 *
 * @param email - Email string
 * @returns Sanitized email hoặc null nếu invalid
 */
export function sanitizeEmailSafe(email: string): string | null {
  const result = EmailSchema.safeParse(email);
  return result.success ? result.data : null;
}

/**
 * Sanitize phone number input
 *
 * @param phone - Phone number string
 * @returns Sanitized phone number
 * @throws Error nếu phone number không hợp lệ
 */
export function sanitizePhoneNumber(phone: string): string {
  return PhoneNumberSchema.parse(phone);
}

/**
 * Sanitize phone number input (safe version)
 * Trả về null thay vì throw error
 *
 * @param phone - Phone number string
 * @returns Sanitized phone number hoặc null nếu invalid
 */
export function sanitizePhoneNumberSafe(phone: string): string | null {
  const result = PhoneNumberSchema.safeParse(phone);
  return result.success ? result.data : null;
}

/**
 * Sanitize username input
 *
 * @param username - Username string
 * @returns Sanitized username
 * @throws Error nếu username không hợp lệ
 */
export function sanitizeUsername(username: string): string {
  return UsernameSchema.parse(username);
}

/**
 * Sanitize username input (safe version)
 * Trả về null thay vì throw error
 *
 * @param username - Username string
 * @returns Sanitized username hoặc null nếu invalid
 */
export function sanitizeUsernameSafe(username: string): string | null {
  const result = UsernameSchema.safeParse(username);
  return result.success ? result.data : null;
}

/**
 * Sanitize URL input
 *
 * @param url - URL string
 * @returns Sanitized URL
 * @throws Error nếu URL không hợp lệ
 */
export function sanitizeUrl(url: string): string {
  return UrlSchema.parse(url);
}

/**
 * Sanitize URL input (safe version)
 * Trả về null thay vì throw error
 *
 * @param url - URL string
 * @returns Sanitized URL hoặc null nếu invalid
 */
export function sanitizeUrlSafe(url: string): string | null {
  const result = UrlSchema.safeParse(url);
  return result.success ? result.data : null;
}

export type MongoSafeString = z.infer<typeof MongoSafeStringSchema>;
export type MongoObjectId = z.infer<typeof MongoObjectIdSchema>;
export type Email = z.infer<typeof EmailSchema>;
export type PhoneNumber = z.infer<typeof PhoneNumberSchema>;
export type Username = z.infer<typeof UsernameSchema>;
export type Url = z.infer<typeof UrlSchema>;
