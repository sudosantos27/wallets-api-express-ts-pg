import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import request from 'supertest';

describe('rate limiter env overrides', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('honors RATE_LIMIT_WINDOW_MS and RATE_LIMIT_MAX via headers', async () => {
    // 60s window, 5 reqs
    vi.stubEnv('RATE_LIMIT_WINDOW_MS', '60000');
    vi.stubEnv('RATE_LIMIT_MAX', '5');

    const { app } = await import('../../src/app');

    const res = await request(app).get('/v1/wallets');

    const policy = res.headers['ratelimit-policy'] || '';
    expect(policy).toContain('5;w=60'); // max=5; window=60s

    const composite = res.headers['ratelimit'] || '';
    expect(composite).toContain('limit=5');
  });

  it('returns 429 when exceeding limit (max=1 in 1s window)', async () => {
    vi.stubEnv('RATE_LIMIT_WINDOW_MS', '1000');
    vi.stubEnv('RATE_LIMIT_MAX', '1');

    const { app } = await import('../../src/app');

    await request(app).get('/v1/wallets');

    const res2 = await request(app).get('/v1/wallets');
    expect(res2.status).toBe(429);
    expect(res2.body).toEqual({
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests. Please try again later.',
      },
    });
  });
});
