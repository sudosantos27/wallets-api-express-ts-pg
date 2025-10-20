// JWT helpers using jsonwebtoken v9 types.
// - Consistent HS256 signing with subject (sub) claim.
// - Narrow, predictable surface: sign/verify.

import jwt, { JwtPayload, SignOptions, Secret } from 'jsonwebtoken';
import { env } from '../env';

const baseSignOpts: SignOptions = {
  algorithm: 'HS256',
};

/**
 * Sign a JWT placing the user id in the standard `sub` (subject) claim.
 */
export function signAccessToken(
  subject: string,
  expiresIn: string | number = env.JWT_EXPIRES_IN,
): string {
  // Build options explicitly and force the shape to SignOptions to avoid overload confusion
  const opts: SignOptions = { ...baseSignOpts, subject, expiresIn: expiresIn as any };

  // Hint the secret as `Secret` so TS picks the correct overload (options, not callback)
  return jwt.sign({}, env.JWT_SECRET as Secret, opts);
}

export function verifyAccessToken<T extends object = JwtPayload>(token: string): T {
  return jwt.verify(token, env.JWT_SECRET as Secret) as T;
}
