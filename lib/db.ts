/**
 * Prisma client singleton.
 *
 * Next.js hot-reloads modules in development, which would otherwise create a
 * new database connection on every change. Caching the client on globalThis
 * keeps a single instance alive across reloads.
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
