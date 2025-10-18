// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        id?: string;
        _id?: string;
        [key: string]: any;
      };
      requestId?: string;
    }
  }
}

export {};
