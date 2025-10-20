// Auth service: credential validation and token issuance.

import { userRepo } from '../repositories/user.repo';
import { verifyPassword } from '../lib/crypto';
import { unauthorized } from '../lib/http';
import { signAccessToken } from '../lib/jwt';

export const authService = {
  async signIn(email: string, password: string) {
    const user = await userRepo.findByEmail(email);
    if (!user) throw unauthorized('Invalid credentials');

    const ok = await verifyPassword(password, user.password);
    if (!ok) throw unauthorized('Invalid credentials');

    const accessToken = signAccessToken(user.id);
    return { accessToken };
  },

  async signOut() {
    return;
  },
};
