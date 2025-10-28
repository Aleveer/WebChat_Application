/**
 * Sanitize user input to prevent MongoDB injection
 * Removes MongoDB operators like $where, $regex, etc.
 *
 * @param input - User input string
 * @returns Sanitized string safe for MongoDB queries
 */
//TODO: Làm test-case cho file này
export function sanitizeMongoInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove MongoDB operators and special characters
  return input
    .replace(/\$/g, '') // Remove $ signs (MongoDB operators)
    .replace(/\{/g, '') // Remove { (object notation)
    .replace(/\}/g, '') // Remove } (object notation)
    .replace(/\[/g, '') // Remove [ (array notation)
    .replace(/\]/g, '') // Remove ] (array notation)
    .trim();
}

/**
 * Escape special regex characters to prevent ReDoS attacks
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
 * Create a safe regex pattern from user input
 * Combines sanitization and escaping for safe regex queries
 *
 * @param input - User input string
 * @param flags - Regex flags (default: 'i' for case-insensitive)
 * @returns Safe RegExp object
 */
export function createSafeRegex(input: string, flags: string = 'i'): RegExp {
  const sanitized = sanitizeMongoInput(input);
  const escaped = escapeRegexCharacters(sanitized);

  // Limit length to prevent ReDoS
  const maxLength = 100;
  const truncated = escaped.substring(0, maxLength);

  return new RegExp(truncated, flags);
}

/**
 * Sanitize object to prevent MongoDB injection in query objects
 * Recursively removes $ operators from object keys
 *
 * @param obj - Object to sanitize
 * @returns Sanitized object
 */
export function sanitizeQueryObject<T extends Record<string, any>>(obj: T): T {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const sanitized = {} as T;

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      // Remove $ from key names
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
 * Validate and sanitize MongoDB ObjectId
 *
 * @param id - Potential ObjectId string
 * @returns Sanitized ID or null if invalid
 */
export function sanitizeObjectId(id: string): string | null {
  if (typeof id !== 'string') {
    return null;
  }

  // MongoDB ObjectId is 24 hex characters
  const objectIdRegex = /^[a-fA-F0-9]{24}$/;

  if (objectIdRegex.test(id)) {
    return id;
  }

  return null;
}

/**
 * Sanitize email input
 *
 * @param email - Email string
 * @returns Sanitized email or null if invalid
 */
export function sanitizeEmail(email: string): string | null {
  if (typeof email !== 'string') {
    return null;
  }

  const sanitized = email.toLowerCase().trim();

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (emailRegex.test(sanitized) && sanitized.length <= 255) {
    return sanitized;
  }

  return null;
}

/**
 * Sanitize phone number input
 *
 * @param phone - Phone number string
 * @returns Sanitized phone or null if invalid
 */
export function sanitizePhoneNumber(phone: string): string | null {
  if (typeof phone !== 'string') {
    return null;
  }

  // Remove all non-digit and non-plus characters
  const sanitized = phone.replace(/[^\d+]/g, '');

  // International format: +[1-9][0-9]{1,14}
  const phoneRegex = /^\+[1-9]\d{1,14}$/;

  if (phoneRegex.test(sanitized)) {
    return sanitized;
  }

  return null;
}
