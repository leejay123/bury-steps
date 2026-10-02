import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 "Cache Components" + "Partial Prefetching": pages keep a
  // ready-made shell (heading, layout, cached content) that shows the
  // instant you tap; only per-person or live parts stream in after. See
  // node_modules/next/dist/docs/01-app/02-guides/instant-navigation.md.
  cacheComponents: true,
  partialPrefetching: true,
  // Parent lockfiles made Next treat ~ as the app root and bundle the wrong Prisma client.
  outputFileTracingRoot: path.join(__dirname),
  images: {
    // Next 16 refuses to resize a local image whose address has a query
    // string unless it's listed here — and every uploaded picture is served
    // with a "?v=<last saved>" tag so browsers fetch the new one after an
    // edit. Without these, uploaded Hero photos showed as broken images.
    // Listing patterns also blocks everything else, so the last entry keeps
    // ordinary site files (no query string) working.
    // Sample walking photos (src/lib/sample-walk-photos.ts) fill the photo
    // heroes until there are enough Hero photos; resized here like the rest.
    // Resized photos are kept a month (default: a day). Each upload's
    // address carries a ?v= tag that changes when it's replaced, so a new
    // photo is never hidden behind an old copy.
    minimumCacheTTL: 2678400,
    // Hero photos ask for 70 (smaller files, no visible difference); 75 is
    // Next's default for everything else.
    qualities: [70, 75],
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
    localPatterns: [
      { pathname: "/api/slides/**" },
      { pathname: "/api/site-logo" },
      { pathname: "/api/report-banner" },
      { pathname: "/icon.png" },
      { pathname: "/**", search: "" },
    ],
  },
  experimental: {
    // The site's styles (about 30 KB) go inside each page instead of a
    // separate file the phone has to fetch before it can draw anything —
    // PageSpeed's "render-blocking requests", ~0.75 s on a slow phone.
    inlineCss: true,
    serverActions: {
      bodySizeLimit: "4mb",
    },
    // Every dynamic page here (Home, Walks, Notices, Messages, Reports, …)
    // has a loading.tsx, and by default Next never caches a dynamic page's
    // actual data client-side (staleTimes.dynamic is 0/off) — so literally
    // every navigation to one, even a prefetched one, refetches from
    // scratch and shows its skeleton for however long that takes. This
    // gives repeat visits within 30s a cached, instant render instead
    // (e.g. clicking Home → Notices → Home again). It does not risk stale
    // data: every mutation in this app (adding a walk, a notice, a message,
    // …) calls revalidatePath, which busts this cache immediately
    // regardless of the 30s window — the only thing this affects is a
    // plain re-visit where nothing changed.
    staleTimes: {
      dynamic: 30,
    },
  },
  async redirects() {
    return [
      {
        source: "/",
        has: [{ type: "host", value: "www.burysteps-walkinggroup.co.uk" }],
        destination: "https://burysteps-walkinggroup.co.uk/",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.burysteps-walkinggroup.co.uk" }],
        destination: "https://burysteps-walkinggroup.co.uk/:path*",
        permanent: true,
      },
      // /dashboard/progress and /dashboard/history moved to top-level
      // /progress and /history (matching /notices) — keep old bookmarks and
      // any links out in the wild working.
      { source: "/dashboard/progress", destination: "/progress", permanent: true },
      { source: "/dashboard/history", destination: "/history", permanent: true },
      // /dashboard itself renamed to /walks (the page was always the walks
      // list — "dashboard" was a leftover from an earlier, more general
      // version of the page). Keep old bookmarks/emails/sign-in redirects
      // working.
      { source: "/dashboard", destination: "/walks", permanent: true },
    ];
  },
  async headers() {
    // Clerk's hosted UI needs its own frontend API domain (the CNAME set up
    // for the live site, or *.clerk.accounts.dev for local dev/anywhere the
    // Vercel preview proxy at /__clerk isn't in play) plus Cloudflare
    // Turnstile for its bot-protection challenge during sign-up. The Account
    // Portal (accounts.burysteps-walkinggroup.co.uk, see ACCOUNT_PORTAL_ORIGIN
    // in lib/urls.ts) is where /sign-in and /sign-up actually redirect to —
    // Clerk's client SDK also does a cross-domain session-sync request to it,
    // which connect-src must allow or the redirect gets blocked. Walk share
    // pages embed OpenStreetMap for the meeting-point map (no API key).
    // Script and style still allow 'unsafe-inline' — a nonce-based policy
    // needs the whole app on dynamic rendering (see Next.js' and Clerk's own
    // docs on this), which is a bigger, riskier change than this pass is
    // making. Even so, restricting connect/frame/img/script *origins* to a
    // known allowlist still blocks the most common CSP-relevant attacks:
    // loading a remote payload or exfiltrating data to an attacker-controlled
    // host.
    const clerkOrigins = [
      "https://clerk.burysteps-walkinggroup.co.uk",
      "https://*.clerk.accounts.dev",
      "https://accounts.burysteps-walkinggroup.co.uk",
    ];
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' ${clerkOrigins.join(" ")} https://challenges.cloudflare.com`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      `connect-src 'self' ${clerkOrigins.join(" ")} https://challenges.cloudflare.com https://vitals.vercel-insights.com`,
      `frame-src 'self' ${clerkOrigins.join(" ")} https://challenges.cloudflare.com https://www.openstreetmap.org`,
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      // Framer Motion (and similar) spin animation work from blob: URLs.
      "worker-src 'self' blob:",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
