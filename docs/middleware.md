# Middleware Overview

Documentation for the custom middleware bundled with the Wallets API (`src/middleware`). These components harden the HTTP surface, enforce authentication, and provide consistent operational tooling (observability, rate limiting, error handling).

## Execution Order in `src/app.ts`

Middleware runs in the following sequence:

1. `requestId` – generates/reuses correlation ids before logging.
2. `pino-http` (configured in `app.ts`) – uses the correlation id for structured logs.
3. Security/parsing: `helmet`, `buildCors`, `express.json`, `compression`.
4. `/health` & `/ready` probes.
5. Swagger docs at `/docs` and `/docs.json`.
6. `rateLimiter` mounted on `/v1`.
7. Feature routers (auth + wallets).
8. `errorHandler` (must be last to catch downstream errors).

The order matters: `requestId` precedes logging, and `rateLimiter` wraps the API surface before controllers run.

## `request-id.ts`

- **Purpose**: Guarantees every request carries a correlation id accessible to logs and clients.
- **Behavior**:
  - Reuses `X-Request-Id` header if provided; otherwise generates a UUID (`crypto.randomUUID`).
  - Sets the header on the response, ensuring downstream services and clients can propagate it.
  - Attaches the id to `req` (`req.id`) for internal access (TypeScript augmentation located in `src/types/express.d.ts`).
- **Key Integration**: `pino-http` uses the existing id via its `genReqId` option to avoid duplicate identifiers.

## `cors.ts`

- **Purpose**: Provides an environment-aware `cors` configuration.
- **Configuration**:
  - Production: enforces an explicit whitelist defined via `CORS_ORIGINS` (comma-separated). Browser requests with origins outside the list are rejected; non-browser clients (no Origin header) are allowed.
  - Development/Test: allows all origins if `CORS_ORIGINS` is empty; otherwise mirrors the production whitelist.
  - Supported headers: `Content-Type`, `Authorization`, `X-Request-Id`. Exposes rate-limit headers to clients.
- **Usage**: `buildCors()` is invoked in `app.ts` so the calling environment decides the policy.

## `rate-limit.ts`

- **Purpose**: Throttles incoming requests to `/v1/*` using `express-rate-limit`.
- **Defaults**:
  - Window: 15 minutes (`RATE_LIMIT_WINDOW_MS`, optional override).
  - Max requests per IP per window: 100 (`RATE_LIMIT_MAX`, optional override).
  - Uses standard rate-limit response headers (`draft-7`) and disables legacy `X-RateLimit-*` headers.
- **Key Details**:
  - Custom `keyGenerator` tolerates environments where `req.ip` may be undefined by falling back to socket info.
  - Returns a structured `429 TOO_MANY_REQUESTS` payload consistent with the service error model.
- **Mounting**: Applied in `app.ts` as `app.use('/v1', rateLimiter)`, leaving health/docs endpoints unthrottled.

## `auth.ts`

- **Purpose**: Enforces Bearer JWT authentication.
- **Workflow**:
  1. Validates the `Authorization` header matches `Bearer <token>` format.
  2. Verifies the token with `verifyAccessToken`, expecting the user id in the `sub` claim.
  3. On success, injects `req.user = { id }` for downstream access.
  4. On failure (missing header, invalid token, missing subject), propagates a `401 UNAUTHORIZED` via `unauthorized()` helper.
- **Notes**: Designed for route-level composition (`router.use(requireAuth)` in `wallet.routes.ts`).

## `error.ts`

- **Purpose**: Centralized error handling for the entire app.
- **Responsibilities**:
  - Pass-through for known `ApiError` instances (ensures status/code/message propagate).
  - Converts `ZodError` validation failures into `400 VALIDATION_ERROR` responses containing `err.issues`.
  - Detects Prisma unique constraint violations (`P2002`) and maps them to `409 CONFLICT` including conflicting fields.
  - Logs unexpected errors using the per-request logger when available; falls back to the global logger.
  - Echoes or sets `X-Request-Id` on responses to keep correlation intact.
- **Placement**: Must sit after all routes and middleware so that thrown or rejected errors bubble into it.

---

By coordinating these middleware components, the service provides secure defaults (CORS, rate limiting, JWT auth), operational visibility (request ids, structured errors), and predictable API behavior across environments.
