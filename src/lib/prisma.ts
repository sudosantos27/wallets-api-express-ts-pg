// Prisma client singleton with optional query logging in non-production environments.
// - In development or with LOG_LEVEL=debug/trace, logs query and duration.
// - Avoids noisy logs in production.

import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

declare global {
  var __prisma__: PrismaClient | undefined;
}

const isProd = process.env.NODE_ENV === 'production';
const level = (process.env.LOG_LEVEL || 'debug').toLowerCase();
const enableQueryEvents = !isProd && (level === 'debug' || level === 'trace');

export const prisma: PrismaClient =
  global.__prisma__ ??
  new PrismaClient({
    log: enableQueryEvents
      ? [{ emit: 'event', level: 'query' }, 'warn', 'error']
      : ['warn', 'error'],
  });

if (enableQueryEvents) {
  // Cast to any to sidestep Prisma's event generic resolving to `never` in some versions
  (prisma as any).$on('query', (e: any) => {
    // Avoid logging params to prevent secret leaks
    logger.debug({ durationMs: e.duration, query: e.query }, 'Prisma query executed');
  });
}

if (!isProd) {
  global.__prisma__ = prisma;
}
