import { connection } from "next/server";
import { getSiteVersion } from "@/lib/site-version";

/**
 * The site's "last changed" fingerprint, asked for by LiveUpdates every 30
 * seconds by every open page. Vercel's CDN hands out the same answer for 15
 * seconds (Vercel-CDN-Cache-Control), so those checks wake a server at most
 * a few times a minute in all, not once per open page — the free plan
 * allows 4 hours of server time a month. Browsers never keep a copy
 * (Cache-Control). See https://vercel.com/docs/headers/cache-control-headers.
 * proxy.ts skips this address: it's the same for everyone.
 */
export async function GET() {
  // Per request, never a copy made at build time.
  await connection();
  return Response.json(
    { v: await getSiteVersion() },
    { headers: { "Cache-Control": "no-store", "Vercel-CDN-Cache-Control": "max-age=15" } },
  );
}
