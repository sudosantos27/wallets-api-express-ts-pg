// JWT helpers: sign and verify access tokens.

import jwt from 'jsonwebtoken';
import { env } from '../env';

type AccessTokenPayload = {
  sub: string; // user id
};

export const signAccessToken = (userId: string) => {
  const payload: AccessTokenPayload = { sub: userId };
  const token = jwt.sign(payload, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.JWT_EXPIRES_IN,
  });
  return token;
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const decoded = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
  if (!decoded?.sub) throw new Error('Missing sub in token');
  return decoded;
};
