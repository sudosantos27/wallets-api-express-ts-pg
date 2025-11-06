# Controllers Overview

Summary of the HTTP controllers that translate Express requests/responses into calls to the service layer. Controllers live in `src/controllers` and stay intentionally thin: they validate input, delegate to services, and standardize HTTP semantics.

## Common Patterns

- **Validation**: All incoming payloads and params are parsed with Zod schemas before hitting business logic (`src/schemas`).
- **Services**: Controllers rely on the service layer (`src/services`) for all business rules and persistence.
- **Errors**: Instead of handling errors directly, controllers `next(err)` any problem so the centralized `errorHandler` can translate it into the API’s error envelope.
- **Req.user**: Protected routes assume `requireAuth` has already populated `req.user` with `{ id }`.

## Auth Controller (`auth.controller.ts`)

Handles credential-based authentication and logout orchestration.

### `signIn`

- **Route**: `POST /v1/signin`
- **Validation**: Parses `req.body` using `SignInBodySchema` (ensures email format, non-empty password).
- **Delegation**: Calls `authService.signIn(email, password)` to verify credentials and issue JWTs.
- **Response**: On success, returns `200 OK` with `{ accessToken }`.
- **Errors**: Validation issues or authentication failures bubble up to the error handler (e.g., `401 UNAUTHORIZED` from the service).

### `signOut`

- **Route**: `POST /v1/signout`
- **Auth**: Requires `Authorization: Bearer <token>` (enforced via middleware before reaching the controller).
- **Behavior**: Invokes `authService.signOut()`. Currently stateless; returns `204 NO_CONTENT`.
- **Errors**: Any unexpected issues propagate to the error handler.

## Wallet Controller (`wallet.controller.ts`)

CRUD entry point for wallet records tied to the authenticated user. All routes assume `requireAuth` has run.

### `listWallets`

- **Route**: `GET /v1/wallets`
- **Action**: Calls `walletService.list(req.user!.id)` and returns the array with `200 OK`.

### `getWallet`

- **Route**: `GET /v1/wallets/:id`
- **Validation**: Ensures `params.id` is a UUID via `WalletIdParamSchema`.
- **Action**: Retrieves the wallet via `walletService.getById(userId, id)` and responds `200 OK`.

### `createWallet`

- **Route**: `POST /v1/wallets`
- **Validation**: Parses body with `CreateWalletBodySchema` (tag optional, chain/address required).
- **Action**: Delegates to `walletService.create(userId, body)`; responds `201 CREATED` with the new wallet.

### `updateWallet`

- **Route**: `PUT /v1/wallets/:id`
- **Validation**: Checks both path (`WalletIdParamSchema`) and body (`UpdateWalletBodySchema` – PUT semantics require chain & address).
- **Action**: Calls `walletService.update(userId, id, body)`; returns `200 OK` with the updated wallet.

### `deleteWallet`

- **Route**: `DELETE /v1/wallets/:id`
- **Validation**: `WalletIdParamSchema` on params.
- **Action**: Invokes `walletService.remove(userId, id)` and responds with `204 NO_CONTENT`.

## Error Propagation

All controller functions wrap their logic in `try/catch` blocks:

- Success → return HTTP response.
- Failure → `next(err)` so middleware can generate consistent JSON error payloads with `X-Request-Id`.

---

These controllers intentionally avoid direct database access or business rules. For modifications, add logic in the services/repositories layer and keep controllers dedicated to HTTP-facing concerns.
