// Application Constants
export const APP_CONSTANTS = {
  // Database
  DATABASE: {
    DEFAULT_LIMIT: 50,
    MAX_LIMIT: 100,
    DEFAULT_PAGE: 1,
  },

  // Messages
  MESSAGES: {
    MAX_TEXT_LENGTH: 1000,
    MIN_TEXT_LENGTH: 1,
    DEFAULT_MESSAGE_LIMIT: 50,
  },

  // Users
  USERS: {
    MIN_PASSWORD_LENGTH: 6,
    MIN_NAME_LENGTH: 1,
    MAX_NAME_LENGTH: 100,
    MAX_USERNAME_LENGTH: 50,
    PHONE_REGEX: /^\+[1-9]\d{1,11}$/,
    PROFILE_PHOTO_REGEX: /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i,
    EMAIL_REGEX: /^(?!.*\.\.)[^\s@]+@[^\s@]+\.[^\s@]+$/, // Email validation - prevents consecutive dots
    USERNAME_REGEX: /^[a-zA-Z0-9_]+$/, // Only alphanumeric and underscores
    FULL_NAME_REGEX: /^[a-zA-Z\s]+$/, // Only letters and spaces
    PASSWORD_REGEX: /^[a-zA-Z0-9!@#$%^&*]+$/, // Only alphanumeric and special characters
  },

  // Groups
  GROUPS: {
    MIN_MEMBERS: 2,
    MAX_NAME_LENGTH: 100,
    MAX_MEMBERS: 256, // Telegram-like limit
  },

  // JWT
  JWT: {
    DEFAULT_EXPIRES_IN: '7d',
    REFRESH_EXPIRES_IN: '30d',
  },

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },

  // File Upload
  FILE_UPLOAD: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_IMAGE_TYPES: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  },

  // Rate Limiting
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
  },
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  // Common
  VALIDATION_FAILED: 'Validation failed',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  CONFLICT: 'Resource already exists',
  INTERNAL_ERROR: 'Internal server error',

  // User specific
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User already exists',
  INVALID_CREDENTIALS: 'Invalid credentials',
  PHONE_NUMBER_EXISTS: 'Phone number already exists',

  // Group specific
  GROUP_NOT_FOUND: 'Group not found',
  NOT_GROUP_MEMBER: 'You are not a member of this group',
  NOT_GROUP_ADMIN: 'Only group admins can perform this action',
  CANNOT_REMOVE_ADMIN: 'Cannot remove other admins',
  GROUP_MUST_HAVE_ADMIN: 'Group must have at least one admin',

  // Message specific
  MESSAGE_NOT_FOUND: 'Message not found',
  CANNOT_DELETE_MESSAGE: 'You can only delete your own messages',
  MESSAGE_TOO_LONG: 'Message is too long',
  MESSAGE_TOO_SHORT: 'Message cannot be empty',

  // File specific
  FILE_TOO_LARGE: 'File is too large',
  INVALID_FILE_TYPE: 'Invalid file type',
  UPLOAD_FAILED: 'File upload failed',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  // User
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  LOGIN_SUCCESS: 'Login successful',

  // Group
  GROUP_CREATED: 'Group created successfully',
  GROUP_UPDATED: 'Group updated successfully',
  GROUP_DELETED: 'Group deleted successfully',
  MEMBER_ADDED: 'Member added successfully',
  MEMBER_REMOVED: 'Member removed successfully',
  ADMIN_UPDATED: 'Admin status updated successfully',

  // Message
  MESSAGE_SENT: 'Message sent successfully',
  MESSAGE_DELETED: 'Message deleted successfully',

  // File
  FILE_UPLOADED: 'File uploaded successfully',
} as const;

// Database Error Codes
export const DB_ERROR_CODES = {
  DUPLICATE_KEY: 11000,
  VALIDATION_ERROR: 121,
  CAST_ERROR: 'CastError',
} as const;

// Receiver Types
export const RECEIVER_TYPES = {
  USER: 'user',
  GROUP: 'group',
} as const;

// User Roles
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

// Group Member Status
export const MEMBER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  REMOVED: 'removed',
} as const;

// Message Types (for future extensions)
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  SYSTEM: 'system',
} as const;

// Cache Keys
export const CACHE_KEYS = {
  USER_PROFILE: 'user:profile:',
  GROUP_INFO: 'group:info:',
  USER_GROUPS: 'user:groups:',
  MESSAGE_COUNT: 'message:count:',
} as const;

// Redis Keys
export const REDIS_KEYS = {
  ONLINE_USERS: 'online:users',
  USER_SESSIONS: 'user:sessions:',
  MESSAGE_QUEUE: 'message:queue',
  NOTIFICATION_QUEUE: 'notification:queue',
} as const;
