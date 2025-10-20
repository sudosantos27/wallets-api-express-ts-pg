// Boot the HTTP server and print clickable URLs regardless of LOG_LEVEL.
// Uses env vars PORT and (optionally) HOST. Defaults: PORT=3000, HOST=0.0.0.0.

import { app } from "./app";
import { env } from "./env";
import { logger } from "./lib/logger";

// Resolve host/port with safe fallbacks
const port = Number(env.PORT) || 3000;
const host = env.HOST ?? "0.0.0.0";

// Start server
const server = app.listen(port, host, () => {
  // This respects LOG_LEVEL (may be hidden in warn/error), but we still keep it.
  logger.info({ host, port }, "API listening");

  // Always show clickable links in the terminal, even if logger is silenced.
  const localUrl = `http://localhost:${port}`;
  const docsUrl = `${localUrl}/docs`;
  console.log(
    [
      "",
      "🚀  API is up",
      `   • ${localUrl}`,
      `   • ${docsUrl}`,
      "",
    ].join("\n")
  );
});

// Graceful shutdown helpers
let isShuttingDown = false;

const shutdown = (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.warn({ signal }, "Shutting down");

  // Safety net: force-exit if close hangs
  const forceExitTimer = setTimeout(() => {
    logger.error("Force exiting after graceful shutdown timeout");
    process.exit(1);
  }, 10_000);
  forceExitTimer.unref();

  server.close((err) => {
    if (err) {
      logger.error({ err }, "Error during server close");
      process.exit(1);
    }
    logger.info("Server closed gracefully");
    clearTimeout(forceExitTimer);
    process.exit(0);
  });
};

// Handle common termination signals
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// In some dev tools (e.g., nodemon/ts-node-dev) SIGUSR2 is used on restarts.
// Close gracefully but re-emit after closing so the tool can restart.
process.on("SIGUSR2", () => {
  logger.warn("Received SIGUSR2 (likely a restart). Closing server...");
  server.close(() => {
    process.kill(process.pid, "SIGUSR2");
  });
});

// Global error handlers
process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled promise rejection");
});

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception");
  // Crash on fatal sync errors to avoid undefined state
  process.exit(1);
});