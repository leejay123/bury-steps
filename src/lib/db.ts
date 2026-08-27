import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaRev?: number;
};

/** Bump when models are added so a long-running `next dev` does not keep a stale client. */
const PRISMA_CLIENT_REV = 2;

function datasourceUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  if (/[?&]connection_limit=/.test(url)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}connection_limit=1`;
}

function createPrismaClient() {
  return new PrismaClient({
    datasourceUrl: datasourceUrl(),
    log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
  });
}

if (globalForPrisma.prismaRev !== PRISMA_CLIENT_REV) {
  void globalForPrisma.prisma?.$disconnect();
  globalForPrisma.prisma = undefined;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaRev = PRISMA_CLIENT_REV;
}
