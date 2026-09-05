import { PrismaClient } from "@prisma/client";

// Avoid exhausting Postgres connections with Next.js hot-reload in dev
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
