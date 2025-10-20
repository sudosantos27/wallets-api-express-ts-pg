// Auth schemas and types for request validation.
// All comments in this file are in English on purpose for code documentation.

import { z } from 'zod';

/**
 * Sign-in payload:
 * - email: required, valid email, normalized (trimmed + lowercased)
 * - password: required, non-empty (policy can be tightened later if required)
 *
 * NOTE: We use ZodString helpers (trim/toLowerCase) before email() so we keep a ZodString chain.
 */
export const SignInBodySchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export type SignInBody = z.infer<typeof SignInBodySchema>;

/**
 * Optional schema for Authorization header if needed at controller layer.
 * Most of the time `requireAuth` middleware will handle this, but leaving it here for completeness.
 */
export const AuthorizationHeaderSchema = z.object({
  authorization: z.string().regex(/^Bearer\s+.+/i, 'Missing or invalid Bearer token'),
});

export type AuthorizationHeader = z.infer<typeof AuthorizationHeaderSchema>;
