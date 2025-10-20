// Wallet service: user-scoped business rules.

import { notFound } from '../lib/http';
import { walletRepo } from '../repositories/wallet.repo';

export const walletService = {
  async list(userId: string) {
    return walletRepo.findAllByUserId(userId);
  },

  async getById(userId: string, id: string) {
    const wallet = await walletRepo.findByIdAndUserId(id, userId);
    if (!wallet) throw notFound('Wallet not found');
    return wallet;
  },

  async create(userId: string, input: { tag?: string; chain: string; address: string }) {
    // Allow tag to be null if omitted for consistency in DB.
    return walletRepo.createForUser(userId, {
      tag: input.tag ?? null,
      chain: input.chain,
      address: input.address,
    });
  },

  async update(
    userId: string,
    id: string,
    input: { tag?: string; chain: string; address: string },
  ) {
    // PUT semantics: full replacement for these fields; missing tag becomes null.
    const affected = await walletRepo.updateByIdForUser(id, userId, {
      tag: input.tag ?? null,
      chain: input.chain,
      address: input.address,
    });
    if (affected.count === 0) throw notFound('Wallet not found');
    return this.getById(userId, id);
  },

  async remove(userId: string, id: string) {
    const deleted = await walletRepo.deleteByIdForUser(id, userId);
    if (deleted.count === 0) throw notFound('Wallet not found');
  },
};
