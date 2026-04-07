import { PrismaClient } from "@prisma/client";
import { existsSync, copyFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";

function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  // In Vercel serverless, the bundled DB is read-only.
  // Copy it to /tmp so Prisma can open it with WAL mode.
  const bundledDb = join(process.cwd(), "prisma", "dev.db");
  const tmpDb = "/tmp/adana.db";

  if (existsSync(bundledDb)) {
    if (!existsSync(tmpDb)) {
      try {
        mkdirSync(dirname(tmpDb), { recursive: true });
        copyFileSync(bundledDb, tmpDb);
      } catch {
        // fallback to bundled (read-only)
        return `file:${bundledDb}`;
      }
    }
    return `file:${tmpDb}`;
  }

  // Local dev fallback
  return "file:./prisma/dev.db";
}

// Set DATABASE_URL before Prisma client initializes
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = getDatabaseUrl();
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
