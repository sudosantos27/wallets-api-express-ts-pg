// Centralized error handler: maps known errors to proper HTTP status codes and payloads.

import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ApiError, badRequest, internal, toErrorPayload } from "../lib/http";
import { logger } from "../lib/logger";

// Prisma error type guard (avoid runtime import intricacies)
type PrismaUniqueError = { code: "P2002"; meta?: { target?: string[] } };
const isPrismaUniqueError = (err: unknown): err is PrismaUniqueError =>
  typeof (err as any)?.code === "string" && (err as any).code === "P2002";

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let apiErr: ApiError;

  if (err instanceof ApiError) {
    apiErr = err;
  } else if (err instanceof ZodError) {
    apiErr = badRequest("Invalid input.", err.issues);
  } else if (isPrismaUniqueError(err)) {
    // Unique constraint violation (e.g., email or address)
    const target = err.meta?.target ?? [];
    apiErr = new ApiError(409, "CONFLICT", "Resource already exists", { target });
  } else {
    // Unexpected error
    apiErr = internal("Unexpected error");
    // Prefer per-request logger (pino-http) if available
    const reqLogger = (req as any).log;
    if (reqLogger && typeof reqLogger.error === "function") {
      reqLogger.error({ err }, "Unexpected error");
    } else {
      logger.error({ err }, "Unexpected error");
    }
  }

  const requestId = (req.headers["x-request-id"] as string | undefined) ?? (req as any).id;
  if (requestId) {
    res.setHeader("x-request-id", requestId);
  }

  res
    .status(apiErr.status)
    .json(toErrorPayload(apiErr, requestId ?? undefined));
};