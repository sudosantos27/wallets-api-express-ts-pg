// Basic rate limiting to protect public endpoints from abuse.
// Uses window + max from environment or sensible defaults.
//
// Env variables (optional):
// - RATE_LIMIT_WINDOW_MS (e.g., "900000" for 15 minutes)
// - RATE_LIMIT_MAX (e.g., "100")

import type { Request, Response } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const windowMs =
  Number(process.env.RATE_LIMIT_WINDOW_MS ?? '') > 0
    ? Number(process.env.RATE_LIMIT_WINDOW_MS)
    : 15 * 60 * 1000; // 15 minutes

const max = Number(process.env.RATE_LIMIT_MAX ?? '') > 0 ? Number(process.env.RATE_LIMIT_MAX) : 100; // per IP per window

export const rateLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: 'draft-7',
  legacyHeaders: false, // disable `X-RateLimit-*`
  // Express typings may allow `req.ip` to be undefined; provide a safe fallback
  keyGenerator: (req: Request) => {
    const ip =
      req.ip ??
      req.socket?.remoteAddress ??
      // last resort; rate-limit library still needs a string
      'unknown';
    return ipKeyGenerator(ip);
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests. Please try again later.',
        requestId: (req.headers['x-request-id'] as string) || undefined,
      },
    });
  },
});
