import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import { getRequestContext } from '@cloudflare/next-on-pages';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prismaInstance: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  // In production (Cloudflare Pages), use the D1 adapter.
  try {
    const { env } = getRequestContext();
    if (env && (env as any).DB) {
      const adapter = new PrismaD1((env as any).DB);
      prismaInstance = new PrismaClient({
        adapter: adapter as any,
        log: ['error', 'warn'],
      });
    } else {
      // Mock for next build when env is undefined
      prismaInstance = new Proxy({} as any, { get: () => () => Promise.resolve([]) }) as any;
    }
  } catch (e) {
    // Mock for next build
    prismaInstance = new Proxy({} as any, { get: () => () => Promise.resolve([]) }) as any;
  }
} else {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  prismaInstance = globalForPrisma.prisma;
}

export const prisma = prismaInstance;
