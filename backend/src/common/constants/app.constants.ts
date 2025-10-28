export const APP_CONSTANTS = {
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20, // Standard default for most endpoints
    MIN_LIMIT: 1,
    MAX_LIMIT: 100, // Maximum to prevent performance issues
  },

  // Database-specific pagination (uses same defaults)
  DATABASE: {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    DEFAULT_PAGE: 1,
  },

  MESSAGES: {
    MAX_TEXT_LENGTH: 2000,
    MIN_TEXT_LENGTH: 1,
    DEFAULT_MESSAGE_LIMIT: 50, // Messages can have higher limit for chat history
  },

  USERS: {
    MIN_PASSWORD_LENGTH: 8,
    MAX_PASSWORD_LENGTH: 64,
    MIN_NAME_LENGTH: 1,
    MAX_NAME_LENGTH: 100,
    MAX_USERNAME_LENGTH: 50,
    PHONE_REGEX: /^\+[1-9]\d{1,14}$/, // Hỗ trợ tối đa 15 số theo ITU-T E.164
    PROFILE_PHOTO_REGEX:
      /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?(#.*)?$/i, // Hỗ trợ query params và fragments
    EMAIL_REGEX: /^(?!.*\.\.)[^\s@]+@[^\s@]+\.[^\s@]+$/, // Email validation - prevents consecutive dots
    USERNAME_REGEX: /^[a-zA-Z0-9_]+$/, // Only alphanumeric and underscores
    FULL_NAME_REGEX: /^[a-zA-Z\s]+$/, // Only letters and spaces
    PASSWORD_REGEX: /^[a-zA-Z0-9!@#$%^&*()_+=\-[\]{}|;:'",.<>?/\\`~]+$/, // Alphanumeric and common special characters
  },

  GROUPS: {
    MIN_MEMBERS: 2,
    MAX_NAME_LENGTH: 100,
    MAX_MEMBERS: 256, // Member Limit
  },

  JWT: {
    DEFAULT_EXPIRES_IN: '7d',
    REFRESH_EXPIRES_IN: '30d',
  },

  FILE_UPLOAD: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_IMAGE_TYPES: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  },

  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
  },

  TIMEOUTS: {
    DEFAULT: 30000, // 30 seconds - standard timeout
    SHORT: 5000, // 5 seconds - for quick operations
    FILE_UPLOAD: 300000, // 5 minutes - for file uploads
    LONG: 60000, // 1 minute - for complex operations
  },

  // DEPRECATED: Use TIMEOUTS instead
  API_CONSTANTS: {
    VERSION: '1.0',
    DEFAULT_TIMEOUT: 30000, // DEPRECATED: Use TIMEOUTS.DEFAULT
    MAX_RETRIES: 3,
  },
} as const;

export const ERROR_MESSAGES = {
  VALIDATION_FAILED: 'Validation failed',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  CONFLICT: 'Resource already exists',
  INTERNAL_ERROR: 'Internal server error',

  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User already exists',
  INVALID_CREDENTIALS: 'Invalid credentials',
  PHONE_NUMBER_EXISTS: 'Phone number already exists',

  GROUP_NOT_FOUND: 'Group not found',
  NOT_GROUP_MEMBER: 'You are not a member of this group',
  NOT_GROUP_ADMIN: 'Only group admins can perform this action',
  CANNOT_REMOVE_ADMIN: 'Cannot remove other admins',
  GROUP_MUST_HAVE_ADMIN: 'Group must have at least one admin',

  MESSAGE_NOT_FOUND: 'Message not found',
  CANNOT_DELETE_MESSAGE: 'You can only delete your own messages',
  MESSAGE_TOO_LONG: 'Message is too long',
  MESSAGE_TOO_SHORT: 'Message cannot be empty',

  FILE_TOO_LARGE: 'File is too large',
  INVALID_FILE_TYPE: 'Invalid file type',
  UPLOAD_FAILED: 'File upload failed',
} as const;

export const SUCCESS_MESSAGES = {
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  LOGIN_SUCCESS: 'Login successful',

  GROUP_CREATED: 'Group created successfully',
  GROUP_UPDATED: 'Group updated successfully',
  GROUP_DELETED: 'Group deleted successfully',
  MEMBER_ADDED: 'Member added successfully',
  MEMBER_REMOVED: 'Member removed successfully',
  ADMIN_UPDATED: 'Admin status updated successfully',

  MESSAGE_SENT: 'Message sent successfully',
  MESSAGE_DELETED: 'Message deleted successfully',

  FILE_UPLOADED: 'File uploaded successfully',
} as const;

export const DB_ERROR_CODES = {
  DUPLICATE_KEY: 11000,
  VALIDATION_ERROR: 121,
  CAST_ERROR: 'CastError',
} as const;

export const RECEIVER_TYPES = {
  USER: 'user',
  GROUP: 'group',
} as const;

export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

export const MEMBER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  REMOVED: 'removed',
} as const;

export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  SYSTEM: 'system',
} as const;

export const CACHE_KEYS = {
  USER_PROFILE: 'user:profile:',
  GROUP_INFO: 'group:info:',
  USER_GROUPS: 'user:groups:',
  MESSAGE_COUNT: 'message:count:',
} as const;

// Security Constants
export const SECURITY_CONSTANTS = {
  BCRYPT_ROUNDS: 12,
  JWT_SECRET_MIN_LENGTH: 32,
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
} as const;

export const ERROR_CODES = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',

  DATABASE_ERROR: 'DATABASE_ERROR',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  DATABASE_VALIDATION_ERROR: 'DATABASE_VALIDATION_ERROR',

  BUSINESS_ERROR: 'BUSINESS_ERROR',

  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export const HTTP_STATUS_TO_ERROR_CODE: Record<number, ErrorCode> = {
  400: ERROR_CODES.BAD_REQUEST,
  401: ERROR_CODES.UNAUTHORIZED,
  403: ERROR_CODES.FORBIDDEN,
  404: ERROR_CODES.NOT_FOUND,
  409: ERROR_CODES.CONFLICT,
  422: ERROR_CODES.VALIDATION_ERROR,
  429: ERROR_CODES.RATE_LIMIT_EXCEEDED,
  408: ERROR_CODES.REQUEST_TIMEOUT,
  500: ERROR_CODES.INTERNAL_ERROR,
};

export function getErrorCodeFromStatus(status: number): ErrorCode {
  return HTTP_STATUS_TO_ERROR_CODE[status] || ERROR_CODES.UNKNOWN_ERROR;
}
