import { connection } from "next/server";
import { getSiteVersion } from "@/lib/site-version";

/** The site's "last changed" fingerprint, asked for by LiveUpdates. */
export async function GET() {
  // Per request, never a copy made at build time.
  await connection();
  return Response.json({ v: await getSiteVersion() }, { headers: { "Cache-Control": "no-store" } });
}
