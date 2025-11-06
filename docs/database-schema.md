# Database Schema

## Overview

This service uses PostgreSQL with Prisma as the ORM. The schema currently models `User` accounts and their associated blockchain `Wallet` records. Every wallet belongs to exactly one user; deleting a user cascades to their wallets.

## Table Summary

| Table  | Purpose                                         | Primary Key | Relationships                                                | Key Indexes                                                     |
| ------ | ----------------------------------------------- | ----------- | ------------------------------------------------------------ | --------------------------------------------------------------- |
| User   | Stores application accounts and credentials.    | `id` (UUID) | One-to-many with `Wallet` via `Wallet.userId`.               | `User_email_key` (unique on `email`)                            |
| Wallet | Tracks blockchain addresses owned by each user. | `id` (UUID) | Many-to-one to `User` via `userId`, cascade on delete/update | `Wallet_address_key` (unique on `address`), `Wallet_userId_idx` |

### User

| Column      | Type      | Attributes                     | Notes                                                                           |
| ----------- | --------- | ------------------------------ | ------------------------------------------------------------------------------- |
| `id`        | UUID      | `@id`, generated with `uuid()` | Primary key shared with related wallets.                                        |
| `email`     | Text      | `@unique`, required            | Lowercase handling recommended; unique index enforces single account per email. |
| `password`  | Text      | Required                       | Stores bcrypt hashes; never store plaintext passwords.                          |
| `createdAt` | Timestamp | Defaults to `now()`            | Creation audit column.                                                          |
| `updatedAt` | Timestamp | Auto-updated on mutation       | Change audit column.                                                            |

**Relations**: Exposes `wallets` array for the one-to-many association.

**Indexes**: `User_email_key` ensures fast lookups and uniqueness by email.

### Wallet

| Column      | Type           | Attributes                         | Notes                                                                      |
| ----------- | -------------- | ---------------------------------- | -------------------------------------------------------------------------- |
| `id`        | UUID           | `@id`, generated with `uuid()`     | Primary key.                                                               |
| `userId`    | UUID           | Foreign key to `User.id`, required | Enforces ownership; cascade on delete/update keeps orphans from lingering. |
| `tag`       | Text, nullable | Optional human-friendly label      | Persisted as `NULL` when omitted for clarity.                              |
| `chain`     | Text           | Required                           | Identifies blockchain network (e.g., `ethereum`, `bitcoin`).               |
| `address`   | Text           | `@unique`, required                | Global uniqueness avoids duplicate storage across users.                   |
| `createdAt` | Timestamp      | Defaults to `now()`                | Creation audit column.                                                     |
| `updatedAt` | Timestamp      | Auto-updated on mutation           | Change audit column.                                                       |

**Indexes**:

- `Wallet_address_key`: guarantees no duplicate wallet address enters the system.
- `Wallet_userId_idx`: speeds up per-user queries (`walletRepo.findAllByUserId`).

**Foreign key**:

- `userId → User.id` with `ON DELETE CASCADE ON UPDATE CASCADE`.

### Seed Data & Defaults

The optional seed script (`prisma/seed.ts`) provisions demo users (`alice@example.com`, `bob@example.com`) with bcrypt-hashed passwords and can insert a deterministic sample wallet for Alice. Adjust or remove when preparing production data.

### Maintenance Notes

- Update Prisma migrations whenever the schema changes (`npx prisma migrate dev`).
- Use `npm run seed` only against disposable databases; never ship seeded passwords to production.
- Consider replacing the global wallet uniqueness with a composite unique on `(chain, address)` if multi-chain duplicates should be permitted (see the note in the Prisma schema).
