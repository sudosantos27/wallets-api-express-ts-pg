// Integration tests for the wallets CRUD.

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { getAccessToken } from '../utils/auth';

describe('Wallets - CRUD', () => {
  it('should require auth', async () => {
    await request(app).get('/v1/wallets').expect(401);
  });

  it('should create, read, update and delete a wallet', async () => {
    const token = await getAccessToken();

    // Create
    const createRes = await request(app)
      .post('/v1/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        tag: 'Trading',
        chain: 'ethereum',
        address: '0x9999999999999999999999999999999999999999',
      })
      .expect(201);

    const id = createRes.body.id as string;

    // List
    const listRes = await request(app)
      .get('/v1/wallets')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.find((w: any) => w.id === id)).toBeTruthy();

    // Get by id
    const getRes = await request(app)
      .get(`/v1/wallets/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(getRes.body.id).toBe(id);

    // Update (PUT)
    const putRes = await request(app)
      .put(`/v1/wallets/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        tag: 'Primary',
        chain: 'ethereum',
        address: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      })
      .expect(200);

    expect(putRes.body.tag).toBe('Primary');

    // Delete
    await request(app)
      .delete(`/v1/wallets/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    // Verify 404 after delete
    await request(app)
      .get(`/v1/wallets/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('should validate input on PUT (400)', async () => {
    const token = await getAccessToken();

    const create = await request(app)
      .post('/v1/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        tag: 'Temp',
        chain: 'bitcoin',
        address: 'bc1qzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
      })
      .expect(201);

    const id = create.body.id as string;

    // Missing address -> 400
    const res = await request(app)
      .put(`/v1/wallets/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ tag: 'Broken', chain: 'ethereum' })
      .expect(400);

    expect(res.body?.error?.code).toBe('VALIDATION_ERROR');
  });

  it('should return 409 on duplicate address', async () => {
    const token = await getAccessToken();

    const body = {
        tag: 'Dup1',
        chain: 'ethereum',
        address: '0x1234567890123456789012345678901234567890',
    };

    await request(app)
        .post('/v1/wallets')
        .set('Authorization', `Bearer ${token}`)
        .send(body)
        .expect(201);

    const res = await request(app)
        .post('/v1/wallets')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...body, tag: 'Dup2' })
        .expect(409);

    expect(res.body?.error?.code).toBe('CONFLICT');
    });

    it('should return 404 for a valid but non-existent wallet id', async () => {
    const token = await getAccessToken();
    const validButMissingId = '123e4567-e89b-12d3-a456-426614174000';

    const res = await request(app)
        .get(`/v1/wallets/${validButMissingId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

    expect(res.body?.error?.code).toBe('NOT_FOUND');
    });

    it('should return 401 on invalid token', async () => {
    const res = await request(app)
        .get('/v1/wallets')
        .set('Authorization', 'Bearer INVALID')
        .expect(401);
    expect(res.body?.error?.code).toBe('UNAUTHORIZED');
    });
});