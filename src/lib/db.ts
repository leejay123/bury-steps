import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaRev?: number;
};

/** Bump when models are added so a long-running `next dev` does not keep a stale client. */
const PRISMA_CLIENT_REV = 4;

function withQueryParam(url: string, key: string, value: string) {
  if (new RegExp(`[?&]${key}=`).test(url)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}${key}=${value}`;
}

/**
 * Serverless isolates each open their own Prisma client. Supabase session
 * pooling (port 5432) caps that at ~15 connections and then 500s the site.
 * Transaction pooling (6543) multiplexes those isolates. Migrations still use
 * DATABASE_URL as stored in Vercel (session / 5432).
 */
export function runtimeDatasourceUrl(url = process.env.DATABASE_URL) {
  if (!url) return undefined;

  let next = url.replace(/pooler\.supabase\.com:5432/i, "pooler.supabase.com:6543");
  if (/pooler\.supabase\.com:6543/i.test(next)) {
    next = withQueryParam(next, "pgbouncer", "true");
  }
  return withQueryParam(next, "connection_limit", "1");
}

function createPrismaClient() {
  return new PrismaClient({
    datasourceUrl: runtimeDatasourceUrl(),
    log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
  });
}

if (globalForPrisma.prismaRev !== PRISMA_CLIENT_REV) {
  void globalForPrisma.prisma?.$disconnect();
  globalForPrisma.prisma = undefined;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;
globalForPrisma.prismaRev = PRISMA_CLIENT_REV;
