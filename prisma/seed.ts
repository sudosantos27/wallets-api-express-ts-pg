// Seed script to create test users (and optional wallets).
// Run with: `npm run seed`
// IMPORTANT: ensure DB is up and migrations are applied before seeding.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Default seed users (you can change these):
const USERS = [
  {
    email: "alice@example.com",
    // Never store raw passwords in production; this is only for local seed.
    password: "Password123!",
  },
  {
    email: "bob@example.com",
    password: "Password123!",
  },
];

async function main() {
  // Hash passwords
  const seededUsers = [];
  for (const u of USERS) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.upsert({
      where: { email: u.email.toLowerCase() },
      update: {},
      create: {
        email: u.email.toLowerCase(),
        password: passwordHash,
      },
    });
    seededUsers.push({ ...user, rawPassword: u.password });
  }

  // Optionally: pre-seed one wallet for Alice (comment out if not needed)
  const alice = seededUsers.find(u => u.email === "alice@example.com");
  if (alice) {
    await prisma.wallet.upsert({
      where: { id: "00000000-0000-0000-0000-000000000001" }, // deterministic id for demo
      update: {},
      create: {
        id: "00000000-0000-0000-0000-000000000001",
        userId: alice.id,
        tag: "Main",
        chain: "ethereum",
        address: "0x1111111111111111111111111111111111111111",
      },
    });
  }

  // Log results (do not log raw hashes)
  console.log("Seeded users:");
  for (const s of seededUsers) {
    console.log(`- ${s.email} (password: ${s.rawPassword})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });