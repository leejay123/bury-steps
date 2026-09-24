/**
 * Paths that skip Clerk's auth.protect() in src/proxy.ts.
 *
 * Kept as a plain list (and tested) so token-based email / invite links
 * can't silently lose their public status the next time someone edits
 * the middleware allowlist.
 */
export const PUBLIC_ROUTE_PATTERNS = [
  "/",
  "/home",
  "/w(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/privacy",
  "/privacy-policy",
  "/terms-of-service",
  "/contact",
  // Email footer links — members manage preferences / unsubscribe without
  // signing in. The token itself is the credential (see
  // src/lib/email/unsubscribe.ts).
  "/email-preferences/(.*)",
  // Organiser-invite email link. The page itself decides whether to send
  // the viewer to sign-in (preserving the invite URL), show an expired /
  // invalid message, or ask them to switch accounts.
  "/organiser-invite/(.*)",
  "/api/webhooks(.*)",
  "/api/cron(.*)",
  "/api/slides(.*)",
  "/api/testimonials(.*)",
  // Site logo shows in the header on public pages for signed-out visitors.
  "/api/site-logo(.*)",
  // Browser-tab favicon (src/app/icon.tsx) — dynamic route, no extension
  // for the matcher’s static-file exclusion to catch.
  "/icon",
  "/api/health",
  "/__clerk(.*)",
  // Organiser URLs 404 for anyone who is not a signed-in organiser —
  // auth.protect() would send members and guests to sign-in and reveal
  // that something lives here.
  "/admin(.*)",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
  "/opengraph-image",
] as const;

/** True when a pathname must stay reachable without a Clerk session. */
export function isTokenPublicPath(pathname: string): boolean {
  return (
    /^\/email-preferences\/[^/]+/.test(pathname) ||
    /^\/organiser-invite\/[^/]+/.test(pathname)
  );
}
