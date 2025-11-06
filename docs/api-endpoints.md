# API Endpoint Documentation

## Overview
RESTful JSON API for the Wallets service. All endpoints return RFC 7807-style error payloads and surface a correlation id in the `X-Request-Id` header. Versioned under `/v1`; health probes live at the root.

Base path: `/`  
Versioned prefix: `/v1`  
Authentication: Bearer JWT (`Authorization: Bearer <token>`). Unauthenticated requests get `401 UNAUTHORIZED`.

Rate limiting: Responses may include `RateLimit-Limit`, `RateLimit-Remaining`, and `RateLimit-Reset` headers when limits are configured.

---

## Authentication

### POST /v1/signin
Exchange user credentials for a short-lived access token.

- Headers: `Content-Type: application/json`
- Body:
  ```json
  {
    "email": "alice@example.com",
    "password": "Password123!"
  }
  ```
- Responses:
  - `200 OK` – `{ "accessToken": "<jwt>" }`
  - `400 VALIDATION_ERROR` – Invalid payload (e.g., malformed email)
  - `401 UNAUTHORIZED` – Email/password mismatch
  - `429 TOO_MANY_REQUESTS` – Rate limit exceeded
  - `500 INTERNAL_SERVER_ERROR` – Unexpected failure

Notes:
- Email is trimmed and lowercased before validation (`SignInBodySchema`).
- Tokens carry the user id in the JWT subject (`signAccessToken`).

### POST /v1/signout
Stateless endpoint; client should discard the access token.

- Auth required (`Authorization: Bearer <token>`)
- Body: _none_
- Responses:
  - `204 NO_CONTENT`
  - `401 UNAUTHORIZED`
  - `429 TOO_MANY_REQUESTS`

---

## Wallets (Authenticated)

All wallet routes require a valid Bearer token; middleware (`requireAuth`) verifies the JWT and injects `req.user.id`.

### GET /v1/wallets
List wallets owned by the caller.

- Responses:
  - `200 OK` – JSON array of wallet records
  - `401 UNAUTHORIZED`
  - `429 TOO_MANY_REQUESTS`

Returns objects with `id`, `userId`, `tag`, `chain`, `address`, `createdAt`, `updatedAt`.

### POST /v1/wallets
Create a new wallet bound to the caller.

- Body:
  ```json
  {
    "tag": "Cold Storage",
    "chain": "bitcoin",
    "address": "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080"
  }
  ```
  `tag` optional (≤64 chars), `chain` and `address` required (≤64/256 chars respectively).

- Responses:
  - `201 CREATED` – Persisted wallet
  - `400 VALIDATION_ERROR` – Missing/invalid fields (`CreateWalletBodySchema`)
  - `401 UNAUTHORIZED`
  - `409 CONFLICT` – Address already exists
  - `429 TOO_MANY_REQUESTS`

Notes:
- Omitted `tag` stored as `null`.
- `address` globally unique (`Wallet_address_key`).

### GET /v1/wallets/{id}
Fetch a single wallet the caller owns.

- Path param `id` (UUID)
- Responses:
  - `200 OK` – Wallet JSON
  - `401 UNAUTHORIZED`
  - `404 NOT_FOUND` – No wallet with that id for this user
  - `429 TOO_MANY_REQUESTS`

### PUT /v1/wallets/{id}
Full update of wallet properties.

- Path param `id` (UUID)
- Body matches create schema; PUT demands `chain` and `address` every time.
- Responses:
  - `200 OK` – Updated wallet
  - `400 VALIDATION_ERROR`
  - `401 UNAUTHORIZED`
  - `404 NOT_FOUND`
  - `409 CONFLICT` – Address collision
  - `429 TOO_MANY_REQUESTS`

Business rules:
- Missing `tag` clears it to `null`.
- Ownership enforced via user-scoped queries.

### DELETE /v1/wallets/{id}
Remove a wallet owned by the caller.

- Path param `id` (UUID)
- Responses:
  - `204 NO_CONTENT`
  - `401 UNAUTHORIZED`
  - `404 NOT_FOUND`
  - `429 TOO_MANY_REQUESTS`

Deletion uses `deleteMany` with ownership filters to prevent cross-user deletes.

---

## Error Model
Errors follow:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Wallet not found",
    "details": null,
    "requestId": "6ecf3f1a-1b73-4a48-b3d3-01fbd2c0d0e1"
  }
}
```

Common codes: `VALIDATION_ERROR`, `UNAUTHORIZED`, `NOT_FOUND`, `CONFLICT`, `INTERNAL_SERVER_ERROR`.

---

## Headers & Conventions
- `Authorization`: Bearer token for protected routes.
- `X-Request-Id`: Present on all responses; echo in support requests.
- `Content-Type`: Always `application/json`.
- Rate-limit headers surface when throttling is active.
