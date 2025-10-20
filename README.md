# Wallets API

Backend API for managing users and their wallets. Built with **Express + TypeScript + PostgreSQL** and secured with **JWT**. It includes **Zod** validation, consistent error handling, **OpenAPI** (served via Swagger UI), structured **Pino** logging with per-request correlation **X-Request-Id**, **rate limiting**, **CORS** controls, **health/readiness** probes, CI quality gates, and a comprehensive test setup (Vitest + Supertest + coverage thresholds).

---

## Table of Contents

* [Tech Stack](#tech-stack)
* [Features](#features)
* [Project Structure](#project-structure)
* [Prerequisites](#prerequisites)
* [Environment](#environment)
* [Quick Start (Local Dev)](#quick-start-local-dev)
* [API Docs (Swagger UI)](#api-docs-swagger-ui)
* [Auth Flow](#auth-flow)
* [Error Model](#error-model)
* [Health & Readiness](#health--readiness)
* [Quality Gates](#quality-gates)
* [Testing & Coverage](#testing--coverage)
* [Linting & Formatting](#linting--formatting)
* [OpenAPI Lint](#openapi-lint)
* [Running with Docker Compose (optional)](#running-with-docker-compose-optional)
* [Handy cURL Snippets](#handy-curl-snippets)
* [Troubleshooting](#troubleshooting)
* [License](#license)

---

## Tech Stack

* **Runtime**: Node.js, Express 5
* **Language**: TypeScript
* **DB**: PostgreSQL + Prisma ORM
* **Auth**: JWT (HS256)
* **Validation**: Zod
* **Docs**: OpenAPI 3.0.3 (Swagger UI)
* **Logging**: Pino + pino-http (+ X-Request-Id)
* **Security**: Helmet, CORS, Rate limiting
* **Tests**: Vitest, Supertest
* **CI**: GitHub Actions (migrations, seed, lint, format, typecheck, build, OpenAPI lint, tests + coverage artifact)

---

## Features

* JWT sign-in / sign-out (stateless).
* Wallets CRUD **scoped to the authenticated user**.
* Strong validation with Zod and precise error codes (400/401/404/409/429/500).
* Request correlation id (`X-Request-Id`) across logs and responses.
* Rate limiting (`/v1/*` scope) with `RateLimit-*` headers.
* CORS configurable per environment.
* Health (`/health`) & Readiness (`/ready` with DB check).
* Strict quality gates (ESLint, Prettier, coverage thresholds, OpenAPI lint).

---

## Project Structure

```
src/
  app.ts                # Express app wiring (security, logging, CORS, rate-limit, docs, probes)
  server.ts             # HTTP bootstrap (reads env, starts app)
  env.ts                # Env parsing (uses env.schema)
  docs/
    openapi.yaml        # OpenAPI spec (served at /docs)
    openapi.ts          # Loader for Swagger UI
  lib/
    prisma.ts           # Prisma client singleton (+ optional query log)
    jwt.ts, crypto.ts   # JWT helpers and password hashing
    http.ts, logger.ts  # Error helpers and Pino logger
  middleware/
    request-id.ts       # Correlation id (X-Request-Id)
    cors.ts             # CORS factory (env-driven)
    rate-limit.ts       # express-rate-limit setup
    error.ts            # Centralized error handler
  schemas/
    auth.schema.ts      # Zod schemas (signin, Authorization header)
    wallet.schema.ts    # Zod schemas (wallet dto, id param)
  routes/               # Routers (auth, wallets)
  controllers/          # Thin HTTP controllers
  repositories/         # Data access via Prisma
  services/             # Business logic / orchestration
  types/
    express.d.ts        # Request typing extension (req.id)
prisma/
  schema.prisma         # DB schema
  migrations/           # SQL migrations
  seed.ts               # Dev/test seed users & sample wallet
test/
  integration/          # API integration tests (Vitest + Supertest)
  unit/                 # Unit tests (crypto, error handler)
  utils/                # Helpers (sign-in, DB reset)
```

---

## Prerequisites

* **Node.js 18+** (recommended 20)
* **Docker** (for local PostgreSQL via `docker compose`)

---

## Environment

Configuration is validated via Zod. See `.env.example` and create your `.env`:

```env
NODE_ENV=development
PORT=3000

DATABASE_URL=postgresql://app:app@localhost:5432/walletsdb?schema=public

JWT_SECRET=change-this-in-prod
JWT_EXPIRES_IN=60m
REFRESH_TOKEN_EXPIRES_IN=7d

LOG_LEVEL=debug
PRETTY_LOGS=true

# For production, set explicit origins (comma-separated).
CORS_ORIGINS=http://localhost:3000

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

> In Docker Compose, the DB host is `db`. Locally (without Compose), it’s typically `localhost`.

---

## Quick Start (Local Dev)

1. **Start PostgreSQL**

```bash
docker compose up -d
```

2. **Install deps, generate Prisma client & run migrations**

```bash
npm ci
npx prisma generate
npx prisma migrate dev --name init
```

3. **Seed dev users**

```bash
npm run seed
```

Seeded users:

* `alice@example.com` / `Password123!`
* `bob@example.com` / `Password123!`

4. **Run the API (dev)**

```bash
npm run dev
```

5. **Optional: inspect DB**

```bash
npx prisma studio
```

---

## API Docs (Swagger UI)

* **Swagger UI**: `http://localhost:3000/docs`
* **OpenAPI JSON**: `http://localhost:3000/docs.json`

**Authorize (JWT):**

1. Call **POST `/v1/signin`** with Alice’s credentials.
2. In Swagger UI, click **Authorize**, enter `Bearer <accessToken>`.
3. Invoke protected endpoints normally.

---

## Auth Flow

* **POST `/v1/signin`** → returns `{ accessToken }` (JWT).
* **POST `/v1/signout`** → stateless (client should discard the token).
* All `/v1/*` endpoints require `Authorization: Bearer <token>`.

---

## Error Model

All errors have the same shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHORIZED | NOT_FOUND | CONFLICT | TOO_MANY_REQUESTS | INTERNAL_SERVER_ERROR",
    "message": "Human-readable message",
    "details": [ { "...": "optional structured details" } ],
    "requestId": "correlation id, if available"
  }
}
```

See OpenAPI examples in Swagger UI for each operation.

---

## Health & Readiness

* **`GET /health`** → `200 OK`, body: `OK` (liveness).
* **`GET /ready`** → `200 READY` only if DB is reachable; otherwise `500`.

---

## Quality Gates

* **ESLint**: style & best practices
* **Prettier**: formatting
* **TypeScript**: `tsc --noEmit`
* **OpenAPI lint (Redocly)**: spec quality
* **Vitest coverage thresholds**: build fails if coverage drops

CI pipeline (GitHub Actions) runs: install → prisma validate/generate → migrate → seed → lint → format:check → typecheck → build → OpenAPI lint → tests (coverage) → uploads LCOV artifact.

---

## Testing & Coverage

* Run all tests (verbose):

```bash
npm test
```

* Run with coverage (enforces thresholds):

```bash
npm run coverage
```

* Open coverage report:

```bash
open coverage/index.html         # macOS
# or: xdg-open coverage/index.html (Linux)
# or: start .\coverage\index.html (Windows)
```

Thresholds are configured to fail the job if they’re not met.

---

## Linting & Formatting

```bash
npm run lint         # ESLint
npm run lint:fix     # ESLint (fix)
npm run format       # Prettier write
npm run format:check # Prettier check
```

---

## OpenAPI Lint

Validate spec quality and examples:

```bash
npm run openapi:lint
```

Warnings/errors will point to exact nodes in `src/docs/openapi.yaml`.

---

## Running with Docker Compose (optional)

> You already have a `docker-compose.yml` in the repo. This option runs **PostgreSQL**, executes **migrations** via a short‑lived **migrator** service, and starts the **API** in a container.

### Start everything

```bash
docker compose up -d
```

* `db` → PostgreSQL 16 with a healthcheck.
* `migrator` → waits for `db` to be healthy, then runs `npm ci && npx prisma generate && npx prisma migrate deploy` **once**.
* `api` → runs `npm ci && npx prisma generate && npm run dev` mounted to your local source (hot reload), exposed on **[http://localhost:3000](http://localhost:3000)**.

### Logs & status

```bash
docker compose ps
docker compose logs -f api
```

### Stop / reset

```bash
docker compose down              # stop containers
docker compose down -v           # stop and remove the DB volume (full reset)
```

### Environment

* The compose file sets env vars for `db`, `migrator`, and `api` services.
* Adjust credentials/ports or map values from a `.env` file if you prefer Compose variable substitution.
* Inside Compose, the DB host is **`db`**; from host Node it’s usually **`localhost`**.

### Alternative (host Node + Compose DB)

This repo’s **Quick Start** uses host Node for the API and Compose only for Postgres. That remains the simplest day‑to‑day workflow. Use full Compose only if you want the API containerized as well.

## Handy cURL Snippets

**Health**

```bash
curl -i http://localhost:3000/health
curl -i http://localhost:3000/ready
```

**Sign in**

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/v1/signin \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@example.com","password":"Password123!"}' \
  | jq -r .accessToken)
echo "$TOKEN"
```

**List wallets**

```bash
curl -s http://localhost:3000/v1/wallets \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Create wallet**

```bash
curl -s -X POST http://localhost:3000/v1/wallets \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"tag":"Cold Storage","chain":"bitcoin","address":"bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080"}' | jq
```

**Get / Update / Delete by id**

```bash
WALLET_ID=<uuid>

curl -s http://localhost:3000/v1/wallets/$WALLET_ID \
  -H "Authorization: Bearer $TOKEN" | jq

curl -s -X PUT http://localhost:3000/v1/wallets/$WALLET_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"tag":"Primary","chain":"ethereum","address":"0x2222222222222222222222222222222222222222"}' | jq

curl -i -X DELETE http://localhost:3000/v1/wallets/$WALLET_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## Troubleshooting

* **DB connection errors**
  Ensure Postgres is up: `docker compose ps` and `docker compose logs db`.
  Check `DATABASE_URL` host (`db` inside Compose networks, `localhost` otherwise).

* **Migrations / Prisma client**
  If schema changes: `npx prisma generate && npx prisma migrate dev`.

* **JWT errors in Swagger**
  Make sure to include `Bearer <token>` (with a space) in the Authorize dialog.

* **CORS blocked** (browser)
  In production, set `CORS_ORIGINS` to your frontend origins (comma-separated).

* **Rate limiting (429)**
  Default is 100 requests per 15 minutes per IP under `/v1`. See `RATE_LIMIT_*`.

---

## License

MIT (see `info.license` in the OpenAPI spec).

---

### Scripts (reference)

```json
{
  "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js",
  "seed": "prisma db seed",
  "prisma:studio": "prisma studio",
  "lint": "eslint . --ext .ts,.js",
  "lint:fix": "eslint . --ext .ts,.js --fix",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "test": "vitest --run --reporter=verbose",
  "test:watch": "vitest",
  "coverage": "vitest --run --coverage",
  "test:integration": "vitest --run test/integration",
  "openapi:lint": "redocly lint src/docs/openapi.yaml"
}
```
