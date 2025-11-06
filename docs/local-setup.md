# Local Development Setup

Step-by-step guide for running the Wallets API locally, including environment variables, database provisioning, and helpful scripts.

## 1. Prerequisites

- **Node.js 18+** (20 recommended) with matching `npm`
- **Docker + Docker Compose** for the local PostgreSQL instance
- Optional: `curl`/HTTP client, `psql`, or Prisma Studio for DB inspection

Verify versions:

```bash
node --version
npm --version
docker --version
docker compose version
```

## 2. Clone & Install Dependencies

```bash
git clone <repo-url>
cd express-ts-pg-wallets
npm ci        # uses package-lock.json for reproducible installs
```

> Use `npm install` if you are actively modifying dependencies; `npm ci` is ideal for clean installs.

## 3. Configure Environment Variables

Copy the sample env file (or create a new `.env` at the project root) and adjust values as needed.

```bash
cp .env.example .env
```

Minimum variables:

```env
NODE_ENV=development
PORT=3000

DATABASE_URL=postgresql://app:app@localhost:5432/walletsdb?schema=public

JWT_SECRET=change-me
JWT_EXPIRES_IN=60m
REFRESH_TOKEN_EXPIRES_IN=7d

LOG_LEVEL=debug
PRETTY_LOGS=true
```

Notes:

- Keep `DATABASE_URL` host as `localhost` for local runs without Docker networking.
- When using Docker Compose services, the DB host is `db` (`postgresql://app:app@db:5432/...`).
- Set `CORS_ORIGINS` to a comma-separated list if you need browser access from known origins.

## 4. Boot the Database

Start the PostgreSQL container defined in `docker-compose.yml`.

```bash
docker compose up -d
```

Check logs if the DB takes time to initialize:

```bash
docker compose logs db
```

## 5. Prisma Client, Migrations, Seed

Generate the Prisma client and apply migrations before running the app.

```bash
npx prisma generate
npx prisma migrate dev --name init
```

Seed development users (safe for local only):

```bash
npm run seed
```

Seeded accounts:

- `alice@example.com` / `Password123!`
- `bob@example.com` / `Password123!`

The seed also provisions an example wallet for Alice.

## 6. Run the API

Development server with fast reload:

```bash
npm run dev
```

Alternative logging levels:

- `npm run dev:info` – human-readable logs, fewer details.
- `npm run dev:debug` – verbose logs + pretty-print.

The service listens on `http://localhost:${PORT}` (default `3000`).

### Helpful endpoints

- `GET /health` – liveness probe
- `GET /ready` – readiness + database check
- `POST /v1/signin` – obtain JWT access token
- `GET /docs` – Swagger UI (use the Sign In endpoint, then Authorize with `Bearer <token>`)

## 7. Inspect the Database (Optional)

```bash
npx prisma studio
```

Prisma Studio runs on `http://localhost:5555` by default, providing a GUI for tables.

## 8. Run Tests & Quality Gates

```bash
npm test             # all tests (Vitest)
npm run coverage     # includes coverage report
npm run lint         # ESLint
npm run format:check # Prettier verification
npm run typecheck    # TypeScript noEmit check
npm run openapi:lint # Lint the OpenAPI spec with Redocly
```

Use `npm run test:watch` during development for live feedback.

## 9. Common Troubleshooting

- **Prisma migrate errors**: ensure the DB container is running and that `.env` matches the container host/port; rerun `prisma migrate dev`.
- **JWT errors (401)**: confirm you are sending `Authorization: Bearer <accessToken>` from `/v1/signin`.
- **Database conflicts**: wallet addresses are globally unique—delete duplicates or adjust the unique constraint if needed.
- **Docker port clashes**: change `5432` in `docker-compose.yml` or stop existing local Postgres services.
- **TypeScript preload warnings**: ensure `npm ci` ran successfully; delete `node_modules` and reinstall if needed.

## 10. Shutting Down

```bash
docker compose down
```

Add `--volumes` if you want to wipe local DB data.

---

You now have a full local environment with hot reloading, seeded users, and Prisma tooling ready for iteration or API testing.
