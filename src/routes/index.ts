// Root router mounting feature routers under /v1.

import { Router } from "express";
import authRoutes from "./auth.routes";
import walletRoutes from "./wallet.routes";

const router = Router();

router.use("/v1", authRoutes);
router.use("/v1/wallets", walletRoutes);

export default router;