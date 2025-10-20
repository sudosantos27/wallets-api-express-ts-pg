// Test helpers for authentication: sign in and return a JWT.

import request from 'supertest';
import { app } from '../../src/app';

export async function getAccessToken(email = 'alice@example.com', password = 'Password123!') {
  const res = await request(app).post('/v1/signin').send({ email, password }).expect(200);

  return res.body.accessToken as string;
}
