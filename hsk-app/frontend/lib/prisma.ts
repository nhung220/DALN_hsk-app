/**
 * Prisma Client singleton
 * PERF: dùng globalThis để tái sử dụng connection qua hot-reload trong dev.
 * Trong prod mỗi process chỉ tạo 1 instance.
 */
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
    datasources: {
      db: { url: process.env.DATABASE_URL },
    },
  });
}

export const prisma: PrismaClient =
  globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
