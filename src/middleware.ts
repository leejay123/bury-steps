import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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
  "/api/health",
  "/__clerk(.*)",
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

    // Walk links can be opened without an account. Clock-in still needs a
    // signed-in member; the walk page asks guests to join first.
    if (!isPublic(req)) await auth.protect();
  },
  {
    authorizedParties: [
      "https://burysteps-walkinggroup.co.uk",
      "https://www.burysteps-walkinggroup.co.uk",
    ],
    // Proxy only on *.vercel.app. The live domain uses Clerk's CNAME
    // (clerk.burysteps-walkinggroup.co.uk), not /__clerk.
    frontendApiProxy: {
      enabled: (url) => url.hostname.endsWith(".vercel.app"),
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
