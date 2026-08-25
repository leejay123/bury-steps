import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublic = createRouteMatcher([
  "/",
  "/home",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/privacy",
  "/privacy-policy",
  "/terms-of-service",
  "/api/webhooks(.*)",
  "/api/cron(.*)",
  "/api/slides(.*)",
  "/__clerk(.*)",
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

    // Walk links are protected on purpose: you must be a signed-in member to
    // clock in. Clerk sends unauthenticated visitors to sign-in and returns
    // them to /w/<token> afterwards.
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
