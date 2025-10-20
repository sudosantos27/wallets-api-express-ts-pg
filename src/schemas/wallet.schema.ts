// Wallet schemas and types for request validation.
// All comments in this file are in English on purpose for code documentation.

import { z } from 'zod';

// General constraints for production-grade inputs
const TAG_MAX = 64;
const CHAIN_MAX = 64;
const ADDRESS_MAX = 256;

/**
 * Path parameter schema for routes that require a wallet ID.
 * We assume UUIDs for IDs in our data model.
 */
export const WalletIdParamSchema = z.object({
  id: z.string().uuid('Invalid wallet id'),
});
export type WalletIdParam = z.infer<typeof WalletIdParamSchema>;

/**
 * Create wallet payload:
 * - tag: optional, trimmed, limited length
 * - chain: required, non-empty, trimmed, limited length
 * - address: required, non-empty, trimmed, limited length
 *
 * NOTE: We are not enforcing chain-specific address formats here.
 *       If the spec later requires that, we can plug a chain-aware validator.
 */
export const CreateWalletBodySchema = z.object({
  tag: z.string().trim().max(TAG_MAX, `tag must be at most ${TAG_MAX} characters`).optional(),
  chain: z
    .string()
    .trim()
    .min(1, 'chain is required')
    .max(CHAIN_MAX, `chain must be at most ${CHAIN_MAX} characters`),
  address: z
    .string()
    .trim()
    .min(1, 'address is required')
    .max(ADDRESS_MAX, `address must be at most ${ADDRESS_MAX} characters`),
});
export type CreateWalletBody = z.infer<typeof CreateWalletBodySchema>;

/**
 * Update wallet payload (PUT semantics requested by the spec):
 * - We require chain and address again (full replacement semantics).
 * - tag remains optional; if omitted, business logic may keep or clear it —
 *   we will define that behavior in the service layer.
 */
export const UpdateWalletBodySchema = z.object({
  tag: z.string().trim().max(TAG_MAX, `tag must be at most ${TAG_MAX} characters`).optional(),
  chain: z
    .string()
    .trim()
    .min(1, 'chain is required')
    .max(CHAIN_MAX, `chain must be at most ${CHAIN_MAX} characters`),
  address: z
    .string()
    .trim()
    .min(1, 'address is required')
    .max(ADDRESS_MAX, `address must be at most ${ADDRESS_MAX} characters`),
});
export type UpdateWalletBody = z.infer<typeof UpdateWalletBodySchema>;
