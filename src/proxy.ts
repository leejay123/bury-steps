import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { clerkAuthorizedParties, shouldProxyClerkFrontendApi } from "@/lib/urls";

const isPublic = createRouteMatcher([
  "/",
  "/home",
  "/w(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/privacy",
  "/privacy-policy",
  "/terms-of-service",
  "/api/webhooks(.*)",
  "/api/cron(.*)",
  "/api/slides(.*)",
  "/api/testimonials(.*)",
  // Site logo shows in the header on public pages (home, walk share links)
  // for signed-out visitors too — without this it 404s/redirects for them
  // instead of serving the image once an admin uploads a custom logo.
  "/api/site-logo(.*)",
  "/api/health",
  "/__clerk(.*)",
  // Organiser URLs 404 for anyone who is not a signed-in organiser.
  // auth.protect() would send members and guests to sign-in, which would
  // reveal that something lives here.
  "/admin(.*)",
  // Crawler/browser file-convention routes. Most static extensions are
  // already excluded from the matcher below, but these don't have one
  // (or have one the matcher doesn't exclude), so without this they'd hit
  // auth.protect() and bounce crawlers and not-yet-signed-in installs to
  // sign-in instead of serving the real file.
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
  "/opengraph-image",
]);

export default clerkMiddleware(
  async (auth, req) => {
    const host = req.headers.get("host") ?? "";
    if (host === "www.burysteps-walkinggroup.co.uk") {
      const url = req.nextUrl.clone();
      url.hostname = "burysteps-walkinggroup.co.uk";
      url.protocol = "https:";
      url.port = "";
      return NextResponse.redirect(url, 308);
    }

    // Preview handles /__clerk via frontendApiProxy below. Production unique
    // *.vercel.app URLs still auto-request it; don't fall through to the app
    // (that would call auth() without a proxy handshake).
    if (req.nextUrl.pathname.startsWith("/__clerk")) {
      return new NextResponse(null, { status: 404 });
    }

    // Walk links can be opened without an account. Clock-in still needs a
    // signed-in member; the walk page asks guests to join first.
    if (!isPublic(req)) await auth.protect();
  },
  {
    authorizedParties: clerkAuthorizedParties(),
    // Proxy only on Vercel Preview. The live domain uses Clerk's CNAME
    // (clerk.burysteps-walkinggroup.co.uk), not /__clerk. Production unique
    // *.vercel.app URLs (Vercel screenshots) must not proxy: this instance
    // has no proxy URL registered, so Clerk's FAPI returns 400.
    frontendApiProxy: {
      enabled: (url) => shouldProxyClerkFrontendApi(url.hostname),
      path: "/__clerk",
    },
  },
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
