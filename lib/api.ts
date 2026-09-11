/**
 * Small helpers shared by every route handler: consistent JSON envelopes,
 * error mapping, request-body parsing and id parsing.
 */

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { formatIssues } from "./validation";

/** Thrown by route logic to produce a specific HTTP status. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: string[]
  ) {
    super(message);
  }
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(status: number, error: string, details?: string[]) {
  return NextResponse.json({ error, ...(details?.length ? { details } : {}) }, { status });
}

/** Parse a JSON body and validate it, or throw a 400 ApiError. */
export async function parseBody<T>(req: Request, schema: z.ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiError(400, "Request body must be valid JSON");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ApiError(400, "Validation failed", formatIssues(result.error));
  }
  return result.data;
}

/** Parse a positive integer route parameter, or throw a 400 ApiError. */
export function parseId(value: string, name = "id"): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new ApiError(400, `${name} must be a positive integer`);
  }
  return n;
}

/**
 * Wrap a handler so every failure becomes a well-formed JSON error response
 * instead of an unhandled exception.
 */
export function handle(fn: () => Promise<Response>): Promise<Response> {
  return fn().catch((err: unknown) => {
    if (err instanceof ApiError) return fail(err.status, err.message, err.details);
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") return fail(404, "Record not found");
      if (err.code === "P2003") return fail(400, "Referenced record does not exist");
      if (err.code === "P2002") return fail(409, "A record with those values already exists");
    }
    console.error("Unhandled API error:", err);
    return fail(500, "Internal server error");
  });
}
