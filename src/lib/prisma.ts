// Prisma client singleton with optional query logging in non-production environments.
// - In development or with LOG_LEVEL=debug/trace, logs query and duration.
// - Avoids noisy logs in production.

import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

declare global {
  var __prisma__: PrismaClient | undefined;
}

const isProd = process.env.NODE_ENV === 'production';

export const prisma: PrismaClient =
  global.__prisma__ ??
  new PrismaClient({
    // You can also enable Prisma's built-in log option if desired.
    // log: isProd ? [] : [{ emit: 'event', level: 'query' }, 'warn', 'error'],
  });

if (!isProd) {
  const level = (process.env.LOG_LEVEL || 'debug').toLowerCase();
  if (level === 'debug' || level === 'trace') {
    // Lightweight query logger (do not log params to avoid secrets)
    prisma.$on('query', (e) => {
      logger.debug({ durationMs: e.duration, query: e.query }, 'Prisma query executed');
    });
  }
}

// Ensure a single instance in dev (hot reloads)
if (!isProd) {
  (global as any).__prisma__ = prisma;
}
