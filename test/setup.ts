// Global test setup for Vitest.
// - Ensures environment variables are loaded.
// - Cleans up DB state between tests where applicable.

import 'dotenv/config';
import { beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '../src/lib/prisma';

// IMPORTANT: DATABASE_URL should point to a test DB/schema.
// In CI it's injected; locally you can set it in .env.test or .env.
beforeAll(async () => {
  // Verify DB connection early
  await prisma.$connect();
});

beforeEach(async () => {
  // Keep seed users; clean only data that tests create frequently.
  // Adjust this list as your schema grows.
  await prisma.wallet.deleteMany({});
});

afterAll(async () => {
  await prisma.$disconnect();
});