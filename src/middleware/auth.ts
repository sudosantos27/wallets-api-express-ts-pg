// requireAuth middleware: verifies JWT and injects req.user.

import { Request, Response, NextFunction } from 'express';
import { unauthorized } from '../lib/http';
import { verifyAccessToken } from '../lib/jwt';

export type AuthUser = { id: string };

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  // Expect Authorization: Bearer <token>
  const header = req.headers.authorization;
  if (!header || !/^Bearer\s+.+/i.test(header)) {
    return next(unauthorized('Missing or invalid Authorization header'));
  }
  const token = header.split(/\s+/)[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub };
    return next();
  } catch {
    return next(unauthorized('Invalid or expired token'));
  }
};
