import { describe, it, expect, vi } from 'vitest';

describe('GET /ready', () => {
  it('returns 200 when DB ping ok', async () => {
    vi.resetModules();
    const { prisma } = await import('../../src/lib/prisma');
    vi.spyOn(prisma, '$queryRaw').mockResolvedValueOnce([] as any);

    const { app } = await import('../../src/app');
    const request = (await import('supertest')).default;

    const res = await request(app).get('/ready');
    expect(res.status).toBe(200);
  });
});
