import express, { json } from "express";
import helmet from "helmet";
import compression from "compression";
import pinoHttp from "pino-http";

import { logger } from "./lib/logger";
import { requestId } from "./middleware/request-id";
import { buildCors } from "./middleware/cors";
import { rateLimiter } from "./middleware/rate-limit";

import routes from "./routes";
import { errorHandler } from "./middleware/error";

import swaggerUi from "swagger-ui-express";
import { openapiSpec } from "./docs/openapi";
import { prisma } from "./lib/prisma";

export const app = express();

// Hide Express signature (defense-in-depth)
app.disable("x-powered-by");

// If running behind a reverse proxy (e.g., Nginx, Heroku, K8s Ingress), trust the proxy to get correct req.ip
// app.set("trust proxy", 1);

// Correlation id must be set before logging middleware
app.use(requestId);

// HTTP logging (requests/responses) with pino
app.use(
  pinoHttp({
    logger,
    // Reduce noise: no log Swagger static assets, favicon, raíz
    autoLogging: {
      ignore: (req) =>
        req.url.startsWith("/docs/swagger-ui") ||
        req.url.startsWith("/docs/favicon") ||
        req.url.endsWith(".css") ||
        req.url.endsWith(".js") ||
        req.url === "/favicon.ico" ||
        req.url === "/",
    },
    // Reuse our request-id
    genReqId: (req) => (req as any).id as string,

    // IMPORTANT: correct signature is (req, res, err)
    customLogLevel: (_req, res, err) => {
      if (err) return "error";
      const status = res.statusCode;
      if (status >= 500) return "error";
      if (status >= 400) return "warn";
      return "info";
    },

    // Redact sensitive headers
    redact: { paths: ["req.headers.authorization"], remove: true },
  })
);

// Security & parsing
app.use(helmet());
app.use(buildCors());
app.use(json());
app.use(compression());

// Liveness probe
app.get("/health", (_req, res) => res.status(200).send("OK"));

// Readiness probe (checks DB connectivity)
app.get("/ready", async (_req, res, next) => {
  try {
    // Simple DB ping; throws if not reachable
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).send("READY");
  } catch (err) {
    next(err);
  }
});

// Redirect root to docs to avoid a noisy 404 on "/"
app.get("/", (_req, res) => res.redirect(302, "/docs"));

// OpenAPI docs (keep before error handler)
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));
app.get("/docs.json", (_req, res) => res.json(openapiSpec));

// Apply rate limiting to API surface
app.use("/v1", rateLimiter);

// Routes
app.use(routes);

// Error handler (must be last)
app.use(errorHandler);