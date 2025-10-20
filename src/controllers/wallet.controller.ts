// Wallet controller: request/response mapping for user-scoped wallet CRUD.

import { Request, Response, NextFunction } from 'express';
import {
  WalletIdParamSchema,
  CreateWalletBodySchema,
  UpdateWalletBodySchema,
} from '../schemas/wallet.schema';
import { walletService } from '../services/wallet.service';

export const listWallets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wallets = await walletService.list(req.user!.id);
    return res.status(200).json(wallets);
  } catch (err) {
    return next(err);
  }
};

export const getWallet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = WalletIdParamSchema.parse(req.params);
    const wallet = await walletService.getById(req.user!.id, params.id);
    return res.status(200).json(wallet);
  } catch (err) {
    return next(err);
  }
};

export const createWallet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = CreateWalletBodySchema.parse(req.body);
    const wallet = await walletService.create(req.user!.id, body);
    return res.status(201).json(wallet);
  } catch (err) {
    return next(err);
  }
};

export const updateWallet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = WalletIdParamSchema.parse(req.params);
    const body = UpdateWalletBodySchema.parse(req.body);
    const wallet = await walletService.update(req.user!.id, params.id, body);
    return res.status(200).json(wallet);
  } catch (err) {
    return next(err);
  }
};

export const deleteWallet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = WalletIdParamSchema.parse(req.params);
    await walletService.remove(req.user!.id, params.id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};
