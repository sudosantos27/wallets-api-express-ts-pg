// Wallet repository: user-scoped access patterns to prevent resource leaks.

import { prisma } from '../lib/prisma';

export type WalletCreateData = {
  tag?: string | null;
  chain: string;
  address: string;
};

export type WalletUpdateData = {
  tag?: string | null;
  chain: string;
  address: string;
};

export const walletRepo = {
  findAllByUserId: (userId: string) =>
    prisma.wallet.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }),

  findByIdAndUserId: (id: string, userId: string) =>
    prisma.wallet.findFirst({ where: { id, userId } }),

  createForUser: (userId: string, data: WalletCreateData) =>
    prisma.wallet.create({ data: { ...data, userId } }),

  updateByIdForUser: (id: string, userId: string, data: WalletUpdateData) =>
    prisma.wallet.updateMany({
      where: { id, userId },
      data,
    }),

  deleteByIdForUser: (id: string, userId: string) =>
    prisma.wallet.deleteMany({ where: { id, userId } }),
};
