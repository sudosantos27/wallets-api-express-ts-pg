// Zod schema for validating and documenting environment variables.
// Use in env.ts to "fail fast" if critical configuration is missing or invalid.

import { z } from 'zod';

// Simple regex for durations like "15m", "7d", "3600s", etc. (not strictly enforced by the app)
const durationRe = /^[0-9]+(ms|s|m|h|d)?$/i;

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Server
  PORT: z
    .string()
    .transform((v) => (v ? v : '3000'))
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, 'PORT must be a positive number'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Auth / JWT
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z
    .string()
    .default('15m')
    .refine((v) => durationRe.test(v), "JWT_EXPIRES_IN must be a duration like '15m' or '3600s'"),
  REFRESH_TOKEN_EXPIRES_IN: z
    .string()
    .default('7d')
    .refine((v) => durationRe.test(v), "REFRESH_TOKEN_EXPIRES_IN must be a duration like '7d'"),

  // Logging
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent']).optional(),
  PRETTY_LOGS: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),

  // CORS
  CORS_ORIGINS: z.string().optional(), // comma-separated origins

  // Rate limit
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .optional()
    .refine(
      (v) => (v === undefined ? true : /^\d+$/.test(v)),
      'RATE_LIMIT_WINDOW_MS must be an integer (ms)',
    ),
  RATE_LIMIT_MAX: z
    .string()
    .optional()
    .refine((v) => (v === undefined ? true : /^\d+$/.test(v)), 'RATE_LIMIT_MAX must be an integer'),
});

export type EnvShape = z.infer<typeof envSchema>;

/**
 * Parses and validates a plain object (e.g., process.env) against envSchema.
 * Throws a ZodError on invalid configuration.
 */
export function parseEnv(input: Record<string, unknown>): EnvShape {
  return envSchema.parse(input);
}
