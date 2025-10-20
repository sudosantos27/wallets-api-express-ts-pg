// Auth HTTP routes.

import { Router } from "express";
import { signIn, signOut } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

// POST /signin
router.post("/signin", signIn);

// POST /signout (requires Authorization)
router.post("/signout", requireAuth, signOut);

export default router;