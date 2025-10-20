// Centralized Pino logger configuration.
// - Redacts sensitive fields (e.g., Authorization header, password).
// - Pretty printing in development when PRETTY_LOGS=true.
// - Forces silent logs during tests (NODE_ENV === "test").
// - Respects LOG_LEVEL in non-test environments.

import pino, { LoggerOptions } from "pino";

const isProd = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";

// In tests, always silence logs regardless of LOG_LEVEL.
const level = isTest
  ? "silent"
  : process.env.LOG_LEVEL ?? (isProd ? "info" : "debug");

const options: LoggerOptions = {
  level,
  base: { service: "wallets-api" },
  // Never log secrets
  redact: {
    paths: [
      "req.headers.authorization",
      "headers.authorization",
      "authorization",
      "password",
      "body.password",
      // add more keys here if needed
    ],
    remove: true,
  },
  // Enable pretty logs only in local dev (not prod, not test)
  transport:
    !isProd && !isTest && process.env.PRETTY_LOGS !== "false"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            singleLine: false,
          },
        }
      : undefined,
};

export const logger = pino(options);