// Wallets HTTP routes (protected).

import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  listWallets,
  getWallet,
  createWallet,
  updateWallet,
  deleteWallet,
} from '../controllers/wallet.controller';

const router = Router();

router.use(requireAuth);

// GET /wallets
router.get('/', listWallets);

// POST /wallets
router.post('/', createWallet);

// GET /wallets/:id
router.get('/:id', getWallet);

// PUT /wallets/:id
router.put('/:id', updateWallet);

// DELETE /wallets/:id
router.delete('/:id', deleteWallet);

export default router;
