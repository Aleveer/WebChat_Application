import { Request } from 'express';

// ============================================================================
// UNIFIED USER TYPE - Based on MongoDB Schema
// ============================================================================
/**
 * User interface matching MongoDB schema
 * This is the primary User type used throughout the application
 */
export interface User {
  id: string; // String representation of _id
  _id: string; // MongoDB ObjectId as string
  phone: string; // Unique phone number
  full_name: string; // User's full name
  username?: string; // Optional unique username
  email?: string; // Optional unique email
  photo?: string; // Optional profile photo URL
  password?: string; // Hashed password (should not be exposed in responses)
  role?: string; // User role (user, admin)
  permissions?: string[]; // User permissions
  groups?: string[]; // Group IDs user belongs to
  adminGroups?: string[]; // Group IDs where user is admin
  created_at?: Date; // Account creation timestamp
  updated_at?: Date; // Last update timestamp
}

/**
 * User Document type for MongoDB operations
 * Handles both ObjectId and string _id
 * Used in decorators and guards where _id might be ObjectId
 */
export interface UserDocument {
  id?: string;
  _id?: { toString: () => string } | string;
  phone?: string;
  full_name?: string;
  username?: string;
  email?: string;
  photo?: string;
  role?: string;
  permissions?: string[];
  groups?: string[];
  adminGroups?: string[];
}

// ============================================================================
// OTHER COMMON TYPES
// ============================================================================

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: PaginationMeta;
}

export interface RequestWithUser extends Request {
  user?: User;
  requestId: string;
  correlationId?: string;
  startTime?: number;
}

// Re-export from other type files
export * from './metadata.types';
export * from './database.types';
export * from './response.types';

// Re-export express types
export type { Request, Response } from 'express';
