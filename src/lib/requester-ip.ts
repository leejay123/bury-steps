import { headers } from "next/headers";

/**
 * Best-effort client IP for rate-limiting unauthenticated forms.
 *
 * Prefer platform-set headers over the leftmost `X-Forwarded-For` hop —
 * on Vercel a client can prepend a spoofed address and the real hop is
 * appended, so leftmost-XFF buckets are trivial to bypass.
 */
export async function requesterIpKey(): Promise<string> {
  const h = await headers();
  const vercel = h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  if (vercel) return vercel;
  const realIp = h.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  // Rightmost hop is typically the one added by the trusted proxy.
  const xff = h.get("x-forwarded-for");
  if (xff) {
    const hops = xff.split(",").map((part) => part.trim()).filter(Boolean);
    const last = hops[hops.length - 1];
    if (last) return last;
  }
  return "unknown";
}
