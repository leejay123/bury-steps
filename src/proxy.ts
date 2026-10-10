import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isPublicPath, isUnknownAppPath } from "@/lib/public-routes";
import { MENU_FILLED_COOKIE, NAV_COOKIE } from "@/lib/remembered-nav";
import { clerkAuthorizedParties, shouldProxyClerkFrontendApi } from "@/lib/urls";

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
    // signed-in member; the walk page asks guests to join first. A path that
    // can't be a page at all goes straight to "page not found" — asking a
    // visitor to sign in just to be told that afterwards was confusing.
    const { pathname } = req.nextUrl;
    if (!isPublicPath(pathname) && !isUnknownAppPath(pathname)) await auth.protect();

    // First page after signing in: no remembered menu yet, so the header and
    // phone bar would be empty until the server sent them. Save the menu first
    // (once per browser session), then come straight back to this page.
    if (
      req.method === "GET" &&
      req.headers.get("sec-fetch-dest") === "document" &&
      !pathname.startsWith("/api/") &&
      !req.cookies.has(NAV_COOKIE) &&
      !req.cookies.has(MENU_FILLED_COOKIE) &&
      (await auth()).userId
    ) {
      const fill = new URL("/api/remember-menu", req.url);
      fill.searchParams.set("next", `${pathname}${req.nextUrl.search}`);
      return NextResponse.redirect(fill, 307);
    }
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
    // /api/site-version is skipped: the same public answer for everyone,
    // asked for every 30 seconds by every open page, so it shouldn't cost a
    // sign-in check each time (see its route.ts).
    "/((?!_next|api/site-version|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|mp4|webm|mov)).*)",
    "/(api(?!/site-version)|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
