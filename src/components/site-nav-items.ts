export function navItems(isAdmin: boolean, walksHref: string) {
  return [
    { href: "/", label: "Home" },
    { href: walksHref, label: "Walks" },
    { href: "/notices", label: "Notices" },
    { href: "/progress", label: "Progress" },
    ...(isAdmin
      ? [
          { href: "/admin/members", label: "Members" },
          { href: "/admin/messages", label: "Messages" },
          { href: "/admin/reports", label: "Reports" },
          { href: "/admin/settings", label: "Settings" },
          { href: "/admin/guide", label: "Guide" },
        ]
      : [{ href: "/history", label: "History" }]),
  ];
}

/**
 * Routes that require sign-in but aren't in the middleware's public-route
 * allowlist (see proxy.ts) — a guest's Next.js Link prefetch for one of
 * these is a background fetch() that follows the middleware's redirect to
 * Clerk's cross-origin sign-in page, which the browser then blocks as a
 * CORS violation (loudly, in the console, though the visible link click
 * still works fine via a normal top-level navigation). Prefetching gains a
 * guest nothing here anyway — skip it instead of chasing Clerk CORS config
 * for a background request nobody needs.
 */
const AUTH_ONLY_HREFS = new Set(["/dashboard", "/notices", "/progress", "/history"]);

export function shouldPrefetchNavLink(href: string): boolean {
  return !AUTH_ONLY_HREFS.has(href);
}

export function isNavItemActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  if (href === "/admin") {
    return pathname === "/admin" || pathname.startsWith("/admin/walks");
  }
  if (href === "/admin/settings") {
    return pathname.startsWith("/admin/settings") || pathname.startsWith("/admin/homepage");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
