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
  // Shared walk links (/w/<token>) only — "/w(.*)" also matched /walks,
  // making the members' Walks page skip the sign-in check here.
  "/w/(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/privacy",
  "/privacy-policy",
  "/terms-of-service",
  "/contact",
  "/apps",
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
  // "Has anything changed?" fingerprint for open pages (LiveUpdates) —
  // visitors' pages refresh too. Only a meaningless code, no data.
  "/api/site-version",
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

// Each pattern as a regular expression: `(.*)` matches anything, the rest
// literally, letter case ignored and a trailing slash allowed — the same as
// Clerk's createRouteMatcher (deprecated) read them.
const PUBLIC_ROUTE_REGEXES = PUBLIC_ROUTE_PATTERNS.map((pattern) => {
  const body = pattern
    .split("(.*)")
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${body}/?$`, "i");
});

/** True when src/proxy.ts lets this path through without signing in. */
export function isPublicPath(pathname: string): boolean {
  return PUBLIC_ROUTE_REGEXES.some((regex) => regex.test(pathname));
}

/** True when a pathname must stay reachable without a Clerk session. */
export function isTokenPublicPath(pathname: string): boolean {
  return (
    /^\/email-preferences\/[^/]+/.test(pathname) ||
    /^\/organiser-invite\/[^/]+/.test(pathname)
  );
}

/**
 * Every top-level name under src/app (folders and route files), plus the
 * framework's own. A path starting with anything else can't be a page, so
 * the middleware lets it through to the ordinary "page not found" instead
 * of sending a visitor with a mistyped or old link to sign in first.
 *
 * Everything listed here stays protected by default, exactly as before.
 * public-routes.test.ts checks this list against src/app, so a new
 * top-level page can't be added without it (and so can't skip sign-in).
 */
export const APP_TOP_LEVEL_SEGMENTS = [
  "admin",
  "api",
  "apple-icon.png",
  "apps",
  "contact",
  "email-preferences",
  "history",
  "home",
  "icon",
  "manifest.webmanifest",
  "notices",
  "onboarding",
  "opengraph-image",
  "organiser-invite",
  "privacy",
  "privacy-policy",
  "progress",
  "robots.txt",
  "sign-in",
  "sign-up",
  "sitemap.xml",
  "terms-of-service",
  "w",
  "walks",
  "_next",
  "__clerk",
] as const;

const KNOWN_TOP_LEVEL = new Set<string>(APP_TOP_LEVEL_SEGMENTS);

/** True for a path that can't match any page or route in the app. */
export function isUnknownAppPath(pathname: string): boolean {
  const first = pathname.split("/")[1] ?? "";
  if (first === "") return false;
  return !KNOWN_TOP_LEVEL.has(first);
}
