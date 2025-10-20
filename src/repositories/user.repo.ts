// User repository: DB access isolated from business logic.

import { prisma } from '../lib/prisma';

export const userRepo = {
  findByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),
  findById: (id: string) => prisma.user.findUnique({ where: { id } }),
};
