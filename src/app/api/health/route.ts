import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Uptime-monitor endpoint. Public and unauthenticated on purpose — a
 * monitor should not need a Clerk session to hit this. Checks a real
 * database round trip rather than just "the server responded", since a
 * dead database is the failure mode most worth paging on.
 */
export async function GET() {
  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    console.error("[api/health] database check failed", err);
    return NextResponse.json(
      { ok: false, database: "down" },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    database: "up",
    latencyMs: Date.now() - startedAt,
  });
}
