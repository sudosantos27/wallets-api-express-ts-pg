// Basic rate limiting to protect public endpoints from abuse.
// Uses window + max from environment or sensible defaults.
//
// Env variables (optional):
// - RATE_LIMIT_WINDOW_MS (e.g., "900000" for 15 minutes)
// - RATE_LIMIT_MAX (e.g., "100")

import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const windowMs =
  Number(process.env.RATE_LIMIT_WINDOW_MS ?? '') > 0
    ? Number(process.env.RATE_LIMIT_WINDOW_MS)
    : 15 * 60 * 1000; // 15 minutes default

const max = Number(process.env.RATE_LIMIT_MAX ?? '') > 0 ? Number(process.env.RATE_LIMIT_MAX) : 100; // 100 requests per window per IP

export const rateLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: 'draft-7',
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: ipKeyGenerator(),
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests. Please try again later.',
        requestId: req.headers['x-request-id'] as string | undefined,
      },
    });
  },
});
