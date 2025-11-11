import { Request } from 'express';

/**
 * Extended Express Request interface
 * Matches JWT payload structure from JwtStrategy
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string; // User ID from JWT payload (primary)
        id?: string; // Alternative user ID (legacy)
        _id?: string; // MongoDB ObjectId as string (legacy)
        username?: string; // Username from JWT
        phone?: string; // Phone number from JWT
        photo?: string; // Profile photo URL from JWT
        full_name?: string; // User's full name
        role?: string; // User role (user, admin)
        permissions?: string[]; // User permissions
        groups?: string[]; // Group IDs user belongs to
        adminGroups?: string[]; // Group IDs where user is admin
      };
      requestId: string;
      correlationId?: string;
      startTime?: number;
    }
  }
}

export {};
