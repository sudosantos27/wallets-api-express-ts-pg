// Auth service: credential validation and token issuance.

import { userRepo } from "../repositories/user.repo";
import { verifyPassword } from "../lib/crypto";
import { unauthorized } from "../lib/http";
import { signAccessToken } from "../lib/jwt";

export const authService = {
  async signIn(email: string, password: string) {
    // Email must be normalized at validation layer; we assume it's lowercase already.
    const user = await userRepo.findByEmail(email);
    if (!user) throw unauthorized("Invalid credentials");

    const ok = await verifyPassword(password, user.password);
    if (!ok) throw unauthorized("Invalid credentials");

    const accessToken = signAccessToken(user.id);
    return { accessToken };
  },

  // Stateless sign-out: the client should discard the token after this call.
  async signOut() {
    // In a stateless setup, nothing to do server-side.
    return;
  },
};