// Password hashing and verification helpers.

import bcrypt from "bcryptjs";

const DEFAULT_ROUNDS = 10;

export const hashPassword = async (raw: string) => {
  const salt = await bcrypt.genSalt(DEFAULT_ROUNDS);
  return bcrypt.hash(raw, salt);
};

export const verifyPassword = async (raw: string, hash: string) => {
  return bcrypt.compare(raw, hash);
};