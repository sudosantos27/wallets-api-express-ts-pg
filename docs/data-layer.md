# Data Layer Overview

Documentation for the repository and service layers (`src/repositories` and `src/services`). Repositories isolate Prisma access patterns, while services encode business rules, validation semantics, and cross-entity workflows.

## Repositories (`src/repositories`)
Repositories expose minimal CRUD helpers tailored to the domain and scoped to prevent leakage (e.g., user-specific queries). They import the Prisma client from `src/lib/prisma`.

### `user.repo.ts`
- **`findByEmail(email: string)`** – Returns a single `User` by unique email (`prisma.user.findUnique`).
- **`findById(id: string)`** – Fetches a `User` by primary key (`prisma.user.findUnique`).

Use cases:
- Authentication flow needs `findByEmail` to validate credentials.
- Future user-facing endpoints can reuse `findById`.

### `wallet.repo.ts`
All wallet queries are scoped by `userId` to ensure access control at the data layer itself.

- **`findAllByUserId(userId: string)`** – Lists wallets for the user (ordered newest first).
- **`findByIdAndUserId(id: string, userId: string)`** – Returns a wallet only if it belongs to the user.
- **`createForUser(userId: string, data)`** – Inserts a wallet, injecting the owner id.
- **`updateByIdForUser(id: string, userId: string, data)`** – Runs `updateMany` with combined filters to avoid throwing when the wallet doesn’t belong to the caller. Returns Prisma `count`.
- **`deleteByIdForUser(id: string, userId: string)`** – Deletes with user scoping; returns `count` for confirmation.

These patterns guard against accidentally reading or mutating wallets across users even if service-layer logic regresses.

## Services (`src/services`)
Services orchestrate repositories, enforce business rules, and translate technical failures into domain-specific errors (e.g., not found).

### `auth.service.ts`
Implements credential validation and token issuance.

- **Dependencies**: `userRepo`, `verifyPassword` (`src/lib/crypto`), `unauthorized` helper, `signAccessToken` (`src/lib/jwt`).
- **`signIn(email, password)`**:
  - Fetches the user by email.
  - Verifies the password against the stored hash.
  - Throws `unauthorized('Invalid credentials')` if the check fails at any step.
  - On success, issues a JWT by placing the user id in the `sub` claim.
  - Returns `{ accessToken }` for controller/route consumption.
- **`signOut()`**: Currently a no-op; placeholder for future stateful logout (refresh-token revocation, etc.).

### `wallet.service.ts`
Business logic for wallet CRUD under a specific user.

- **Dependencies**: `walletRepo`, `notFound` helper.
- **`list(userId)`** – Pass-through to `walletRepo.findAllByUserId`.
- **`getById(userId, id)`** – Fetches via repository; if missing, throws `notFound('Wallet not found')`.
- **`create(userId, input)`**:
  - Normalizes optional `tag` to `null` to keep database representation consistent.
  - Delegates to `walletRepo.createForUser`.
- **`update(userId, id, input)`**:
  - Normalizes `tag` to `null` when omitted.
  - Calls `walletRepo.updateByIdForUser`; checks `affected.count` to detect missing resources.
  - If no rows updated, throws `notFound`.
  - Retrieves the updated record via `getById` for the response.
- **`remove(userId, id)`**:
  - Delegates to `walletRepo.deleteByIdForUser`.
  - Throws `notFound` if `deleted.count === 0`.

Consistency highlights:
- Services do not return Prisma responses directly when additional checks are required. For example, `update` re-fetches the wallet after modifying it to return the latest state.
- `create`/`update` enforce the PUT semantics defined in the API (tag omission clears it).
- Error helpers (`unauthorized`, `notFound`) ensure the controller layer can rely on standardized exceptions.

---

When extending the domain:
- Add new data access patterns to repositories first (keeping user scoping in mind).
- Integrate them through services where business rules, validation, and error handling are applied.
- Controllers should remain thin wrappers around these services to preserve separation of concerns.
