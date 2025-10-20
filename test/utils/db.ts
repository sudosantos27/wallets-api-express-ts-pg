// DB helpers for tests (factories, direct inserts if needed)

import { prisma } from '../../src/lib/prisma';

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
}
