import { Request } from 'express';

/**
 * Extended Express Request interface
 * Matches MongoDB User schema
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string; // String representation of _id
        _id: string; // MongoDB ObjectId as string
        phone_number: string; // Unique phone number
        full_name: string; // User's full name
        username?: string; // Optional unique username
        email?: string; // Optional unique email
        profile_photo?: string; // Optional profile photo URL
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
