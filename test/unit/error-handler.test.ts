import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { ZodError, z } from "zod";
import { errorHandler } from "../../src/middleware/error";
import { unauthorized } from "../../src/lib/http";
import { logger } from "../../src/lib/logger";

function createMockRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

describe("errorHandler middleware", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    // Silence logger.error during tests
    errorSpy = vi.spyOn(logger, "error").mockImplementation(() => undefined as any);
  });

  afterAll(() => {
    // Restore original logger.error
    errorSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it("passes through ApiError (401)", () => {
    const req = { headers: {} } as Request;
    const res = createMockRes();
    const next = vi.fn() as NextFunction;

    const err = unauthorized("Invalid token");
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: "UNAUTHORIZED",
          message: "Invalid token",
        }),
      })
    );
  });

  it("maps ZodError to 400 with details", () => {
    const req = { headers: {} } as Request;
    const res = createMockRes();
    const next = vi.fn() as NextFunction;

    const Schema = z.object({ email: z.string().email() });
    let zerr!: ZodError;
    try {
      Schema.parse({ email: "nope" });
    } catch (e) {
      zerr = e as ZodError;
    }
    errorHandler(zerr, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: "VALIDATION_ERROR",
        }),
      })
    );
  });

  it("maps Prisma unique error (P2002) to 409", () => {
    const req = { headers: {} } as Request;
    const res = createMockRes();
    const next = vi.fn() as NextFunction;

    const prismaUniqueErr = { code: "P2002", meta: { target: ["address"] } };
    errorHandler(prismaUniqueErr, req, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: "CONFLICT",
          message: "Resource already exists",
        }),
      })
    );
  });

  it("maps unexpected Error to 500", () => {
    const req = { headers: {} } as Request;
    const res = createMockRes();
    const next = vi.fn() as NextFunction;

    const boom = new Error("boom");
    errorHandler(boom, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unexpected error",
        }),
      })
    );
  });
});