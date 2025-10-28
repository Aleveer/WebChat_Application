import { Request } from 'express';

// Common types
export interface User {
  id: string;
  _id: string;
  phone_number: string;
  fullname: string;
  username?: string;
  email?: string;
  role?: string;
  permissions?: string[];
  groups?: string[];
  adminGroups?: string[];
}

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
