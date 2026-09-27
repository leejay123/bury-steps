import { NextResponse } from "next/server";
import { getOptionalUser } from "@/lib/auth";
import { buildSiteSearchIndex } from "@/lib/site-search";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getOptionalUser();
  if (!user) return NextResponse.json({ error: "Sign in to search." }, { status: 401 });
  const groups = await buildSiteSearchIndex(user);
  return NextResponse.json({ groups }, { headers: { "Cache-Control": "private, no-store" } });
}
