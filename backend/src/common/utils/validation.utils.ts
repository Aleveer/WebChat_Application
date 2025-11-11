import { Types } from 'mongoose';
import { z } from 'zod';
import {
  isEmail,
  isURL,
  isPhoneNumber,
  matches,
  minLength,
  maxLength,
  isMongoId,
  validate,
  ValidationError,
} from 'class-validator';
import { APP_CONSTANTS } from '../constants/app.constants';

/**
 * Zod Schemas cho Validation
 */

// Schema cho MongoDB ObjectId
export const ObjectIdSchema = z
  .string()
  .refine((val) => Types.ObjectId.isValid(val), {
    message: 'ObjectId không hợp lệ',
  });

// Schema cho Email
export const EmailSchema = z
  .string()
  .min(1, 'Email không được để trống')
  .email('Email không hợp lệ')
  .regex(APP_CONSTANTS.USERS.EMAIL_REGEX, 'Email không đúng định dạng')
  .toLowerCase()
  .trim();

// Schema cho Phone Number
export const PhoneNumberSchema = z
  .string()
  .regex(APP_CONSTANTS.USERS.PHONE_REGEX, 'Số điện thoại không hợp lệ')
  .trim();

// Schema cho Password
export const PasswordSchema = z
  .string()
  .min(
    APP_CONSTANTS.USERS.MIN_PASSWORD_LENGTH,
    `Mật khẩu phải có ít nhất ${APP_CONSTANTS.USERS.MIN_PASSWORD_LENGTH} ký tự`,
  )
  .max(
    APP_CONSTANTS.USERS.MAX_PASSWORD_LENGTH,
    `Mật khẩu không được vượt quá ${APP_CONSTANTS.USERS.MAX_PASSWORD_LENGTH} ký tự`,
  )
  .regex(
    APP_CONSTANTS.USERS.PASSWORD_REGEX,
    'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt',
  );

// Schema cho Name
export const NameSchema = z
  .string()
  .min(1, 'Tên không được để trống')
  .max(50, 'Tên không được vượt quá 50 ký tự')
  .regex(/^[a-zA-ZÀ-ỹ\s]+$/, 'Tên chỉ được chứa chữ cái và khoảng trắng')
  .trim();

// Schema cho URL
export const UrlSchema = z.string().url('URL không hợp lệ');

// Schema cho Image URL
export const ImageUrlSchema = z
  .string()
  .url('URL không hợp lệ')
  .regex(
    APP_CONSTANTS.USERS.PHOTO_REGEX,
    'URL ảnh phải có định dạng .jpg, .jpeg, .png, .gif hoặc .webp',
  );

// Schema cho Username
export const UsernameSchema = z
  .string()
  .min(3, 'Username phải có ít nhất 3 ký tự')
  .max(20, 'Username không được vượt quá 20 ký tự')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Username chỉ được chứa chữ cái, số, gạch dưới và gạch ngang',
  )
  .trim();

// Schema cho String không chứa HTML/Script
export const SafeStringSchema = z
  .string()
  .trim()
  .refine(
    (val) => !/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(val),
    {
      message: 'Chuỗi không được chứa thẻ script',
    },
  )
  .refine(
    (val) => !/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi.test(val),
    {
      message: 'Chuỗi không được chứa thẻ iframe',
    },
  );

// Schema cho Age
export const AgeSchema = z
  .number()
  .int('Tuổi phải là số nguyên')
  .min(1, 'Tuổi phải lớn hơn 0')
  .max(150, 'Tuổi không hợp lệ');

// Schema cho Positive Number
export const PositiveNumberSchema = z.number().positive('Số phải lớn hơn 0');

// Types được infer từ schemas
export type ValidObjectId = z.infer<typeof ObjectIdSchema>;
export type ValidEmail = z.infer<typeof EmailSchema>;
export type ValidPhoneNumber = z.infer<typeof PhoneNumberSchema>;
export type ValidPassword = z.infer<typeof PasswordSchema>;
export type ValidName = z.infer<typeof NameSchema>;
export type ValidUrl = z.infer<typeof UrlSchema>;
export type ValidUsername = z.infer<typeof UsernameSchema>;
export type SafeString = z.infer<typeof SafeStringSchema>;

/**
 * Validation Utilities với Class-Validator và Zod
 */
export class ValidationUtils {
  /**
   * Kiểm tra MongoDB ObjectId có hợp lệ không
   * @param id - ObjectId cần kiểm tra
   * @returns true nếu hợp lệ
   */
  static isValidObjectId(id: string): boolean {
    return Types.ObjectId.isValid(id) && isMongoId(id);
  }

  /**
   * Kiểm tra số điện thoại có hợp lệ không (sử dụng class-validator)
   * @param phoneNumber - Số điện thoại cần kiểm tra
   * @returns true nếu hợp lệ
   */
  static isValidPhoneNumber(phoneNumber: string): boolean {
    const phoneRegex = APP_CONSTANTS.USERS.PHONE_REGEX;
    return phoneRegex.test(phoneNumber) && matches(phoneNumber, phoneRegex);
  }

  /**
   * Kiểm tra email có hợp lệ không (sử dụng class-validator)
   * @param email - Email cần kiểm tra
   * @returns true nếu hợp lệ
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = APP_CONSTANTS.USERS.EMAIL_REGEX;
    return emailRegex.test(email) && isEmail(email);
  }

  /**
   * Kiểm tra URL có hợp lệ không (sử dụng class-validator)
   * @param url - URL cần kiểm tra
   * @returns true nếu hợp lệ
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return isURL(url);
    } catch {
      return false;
    }
  }

  /**
   * Kiểm tra URL ảnh có hợp lệ không
   * @param url - URL ảnh cần kiểm tra
   * @returns true nếu hợp lệ
   */
  static isValidImageUrl(url: string): boolean {
    const imageRegex = APP_CONSTANTS.USERS.PHOTO_REGEX;
    return imageRegex.test(url) && this.isValidUrl(url);
  }

  /**
   * Sanitize string (loại bỏ script tags và các thẻ nguy hiểm)
   * @param input - String cần sanitize
   * @returns String đã được làm sạch
   */
  static sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*>/gi, '');
  }

  /**
   * Kiểm tra password có hợp lệ không
   * @param password - Password cần kiểm tra
   * @returns true nếu hợp lệ
   */
  static isValidPassword(password: string): boolean {
    return (
      minLength(password, APP_CONSTANTS.USERS.MIN_PASSWORD_LENGTH) &&
      maxLength(password, APP_CONSTANTS.USERS.MAX_PASSWORD_LENGTH) &&
      matches(password, APP_CONSTANTS.USERS.PASSWORD_REGEX)
    );
  }

  /**
   * Kiểm tra name có hợp lệ không
   * @param name - Name cần kiểm tra
   * @returns true nếu hợp lệ
   */
  static isValidName(name: string): boolean {
    return (
      name.length >= 1 && name.length <= 50 && /^[a-zA-ZÀ-ỹ\s]+$/.test(name)
    );
  }

  /**
   * Validate với Zod schema (safeParse - không throw error)
   * @param schema - Zod schema
   * @param data - Data cần validate
   * @returns Result của validation
   */
  static validateWithZod<T>(schema: z.ZodSchema<T>, data: unknown) {
    return schema.safeParse(data);
  }

  /**
   * Parse và validate với Zod schema (throw error nếu invalid)
   * @param schema - Zod schema
   * @param data - Data cần validate
   * @returns Parsed data
   * @throws ZodError nếu validation fail
   */
  static parseWithZod<T>(schema: z.ZodSchema<T>, data: unknown): T {
    return schema.parse(data);
  }

  /**
   * Validate object với class-validator
   * @param object - Object cần validate (phải có decorators)
   * @returns Promise<ValidationError[]>
   */
  static async validateWithClassValidator(
    object: object,
  ): Promise<ValidationError[]> {
    return await validate(object);
  }

  /**
   * Validate ObjectId với Zod
   * @param id - ObjectId cần validate
   * @returns Result của validation
   */
  static validateObjectId(id: unknown) {
    return ObjectIdSchema.safeParse(id);
  }

  /**
   * Validate Email với Zod
   * @param email - Email cần validate
   * @returns Result của validation
   */
  static validateEmail(email: unknown) {
    return EmailSchema.safeParse(email);
  }

  /**
   * Validate Phone Number với Zod
   * @param phoneNumber - Phone number cần validate
   * @returns Result của validation
   */
  static validatePhoneNumber(phoneNumber: unknown) {
    return PhoneNumberSchema.safeParse(phoneNumber);
  }

  /**
   * Validate Password với Zod
   * @param password - Password cần validate
   * @returns Result của validation
   */
  static validatePassword(password: unknown) {
    return PasswordSchema.safeParse(password);
  }

  /**
   * Validate Name với Zod
   * @param name - Name cần validate
   * @returns Result của validation
   */
  static validateName(name: unknown) {
    return NameSchema.safeParse(name);
  }

  /**
   * Validate URL với Zod
   * @param url - URL cần validate
   * @returns Result của validation
   */
  static validateUrl(url: unknown) {
    return UrlSchema.safeParse(url);
  }

  /**
   * Validate Username với Zod
   * @param username - Username cần validate
   * @returns Result của validation
   */
  static validateUsername(username: unknown) {
    return UsernameSchema.safeParse(username);
  }

  /**
   * Kiểm tra string có chứa các ký tự nguy hiểm không
   * @param input - String cần kiểm tra
   * @returns true nếu an toàn
   */
  static isSafeString(input: string): boolean {
    return SafeStringSchema.safeParse(input).success;
  }

  /**
   * Validate nhiều rules cùng lúc
   * @param value - Giá trị cần validate
   * @param rules - Mảng các validation rules
   * @returns Object chứa kết quả và errors
   */
  static validateMultiple(
    value: unknown,
    rules: Array<{
      schema: z.ZodSchema<any>;
      fieldName: string;
    }>,
  ): {
    isValid: boolean;
    errors: Array<{ field: string; message: string }>;
  } {
    const errors: Array<{ field: string; message: string }> = [];

    for (const rule of rules) {
      const result = rule.schema.safeParse(value);
      if (!result.success) {
        errors.push({
          field: rule.fieldName,
          message: result.error.issues[0]?.message || 'Validation failed',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Tạo custom validator với Zod
   * @param validationFn - Function validation custom
   * @param errorMessage - Error message
   * @returns Zod schema
   */
  static createCustomValidator<T>(
    baseSchema: z.ZodSchema<T>,
    validationFn: (value: T) => boolean,
    errorMessage: string,
  ) {
    return baseSchema.refine(validationFn, { message: errorMessage });
  }

  /**
   * Kiểm tra có phải là số nguyên dương không
   * @param value - Giá trị cần kiểm tra
   * @returns true nếu là số nguyên dương
   */
  static isPositiveInteger(value: number): boolean {
    return Number.isInteger(value) && value > 0;
  }

  /**
   * Kiểm tra chuỗi có độ dài trong khoảng cho phép không
   * @param value - Chuỗi cần kiểm tra
   * @param min - Độ dài tối thiểu
   * @param max - Độ dài tối đa
   * @returns true nếu hợp lệ
   */
  static isLengthInRange(value: string, min: number, max: number): boolean {
    return value.length >= min && value.length <= max;
  }

  /**
   * Strip HTML tags khỏi string
   * @param html - HTML string
   * @returns Plain text
   */
  static stripHtmlTags(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  /**
   * Escape HTML special characters
   * @param text - Text cần escape
   * @returns Escaped text
   */
  static escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
  }
}
