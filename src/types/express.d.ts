// Extend Express Request to include authenticated user payload.

declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
      id?: string;
    }
  }
}

export {};