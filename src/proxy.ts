import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { PUBLIC_ROUTE_PATTERNS } from "@/lib/public-routes";
import { clerkAuthorizedParties, shouldProxyClerkFrontendApi } from "@/lib/urls";

const isPublic = createRouteMatcher([...PUBLIC_ROUTE_PATTERNS]);

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
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|mp4|webm|mov)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
