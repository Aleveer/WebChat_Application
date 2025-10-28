import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
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
      };
      requestId: string;
      correlationId?: string;
      startTime?: number;
    }
  }
}

export {};
