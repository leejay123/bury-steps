import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaRev?: number;
};

/** Bump when models are added so a long-running `next dev` does not keep a stale client. */
const PRISMA_CLIENT_REV = 5;

function withQueryParam(url: string, key: string, value: string) {
  if (new RegExp(`[?&]${key}=`).test(url)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}${key}=${value}`;
}

/**
 * Serverless isolates each open their own Prisma client. Supabase session
 * pooling (port 5432) caps that at ~15 connections and then 500s the site.
 * Transaction pooling (6543) multiplexes those isolates, but the pooler
 * only has 15 real connections to the database (Supabase's default pool
 * size). After a deploy every page is rebuilt at once, several fresh
 * isolates each asked for up to 5, the database slowed under them and
 * requests waited over 60s for a turn (ECHECKOUTTIMEOUT, then P2024). So
 * each client takes at most 2 (Prisma's serverless advice: start small and
 * raise only if spikes stay under the database's limit); a page's other
 * queries wait their turn inside the client instead. Migrations still use
 * DATABASE_URL as stored in Vercel (session / 5432).
 *
 * 4 from November 2026: the pooler's pool size was raised from 15 to 30 (Supabase →
 * Database Settings → Connection pooling), so a handful of fresh isolates after a deploy
 * still fit under it. Raise this only together with that pool size.
 */
function runtimeDatasourceUrl(url = process.env.DATABASE_URL) {
  if (!url) return undefined;

  let next = url.replace(/pooler\.supabase\.com:5432/i, "pooler.supabase.com:6543");
  if (/pooler\.supabase\.com:6543/i.test(next)) {
    next = withQueryParam(next, "pgbouncer", "true");
  }
  next = withQueryParam(next, "connection_limit", "4");
  return withQueryParam(next, "pool_timeout", "20");
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
