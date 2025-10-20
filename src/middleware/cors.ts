// CORS configuration based on environment.
// - In production, only allow explicit origins from CORS_ORIGINS (comma-separated).
// - In development/test, allow all if no CORS_ORIGINS is provided.

import cors, { CorsOptions } from 'cors';

function parseOrigins(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function buildCors() {
  const isProd = process.env.NODE_ENV === 'production';
  const whitelist = parseOrigins(process.env.CORS_ORIGINS);

  let options: CorsOptions;

  if (isProd) {
    // In production, require an explicit whitelist
    options = {
      origin: (origin, callback) => {
        // Allow non-browser clients (no origin) like curl/postman by default
        if (!origin) return callback(null, true);
        if (whitelist.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: false,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      exposedHeaders: ['X-Request-Id', 'RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
      maxAge: 600,
    };
  } else {
    // In dev/test, if no whitelist provided, allow all
    options = {
      origin: whitelist.length > 0 ? whitelist : true,
      credentials: false,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      exposedHeaders: ['X-Request-Id', 'RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
      maxAge: 600,
    };
  }

  return cors(options);
}
