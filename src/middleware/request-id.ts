// Attaches/propagates a correlation id (X-Request-Id) for every request.
// - If the header is present, it is reused.
// - Otherwise, a new UUID is generated.
// - The id is exposed in response headers and available on req.id (see note below).

import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export function requestId(req: Request, res: Response, next: NextFunction) {
  const incoming = (req.headers['x-request-id'] as string | undefined)?.trim();
  const id = incoming && incoming.length > 0 ? incoming : randomUUID();

  // Expose in res headers so downstream services/clients can log it too
  res.setHeader('x-request-id', id);

  // Attach to req (use any if you did not add the type augmentation yet)
  (req as any).id = id;

  next();
}
