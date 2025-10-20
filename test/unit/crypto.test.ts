import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../../src/lib/crypto';

describe('crypto helpers', () => {
  it('hashes and verifies a password', async () => {
    const hash = await hashPassword('Password123!');
    expect(hash).not.toBe('Password123!');
    const ok = await verifyPassword('Password123!', hash);
    expect(ok).toBe(true);
  });

  it('rejects invalid password', async () => {
    const hash = await hashPassword('Password123!');
    const ok = await verifyPassword('wrong', hash);
    expect(ok).toBe(false);
  });
});