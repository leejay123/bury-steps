import {
  FULL_ORGANISER_PERMISSIONS,
  hasAnySettingsPermission,
  type OrganiserPermissions,
} from "@/lib/organiser-permissions";

/**
 * Which nav items an organiser sees depends on their granular permissions
 * (see @/lib/organiser-permissions) — omitted here defaults to full access,
 * which is every real caller's fallback anyway (getOptionalUser's row
 * always carries real values once role is ADMIN) and keeps existing calls
 * (and this file's own tests) working unchanged. The Guide is always shown
 * to any organiser regardless — it's just documentation, nothing to gate.
 *
 * Lacking the Walks permission drops the *admin* walk tools, not walks
 * themselves — every signed-in person, organiser or not, can still browse
 * and clock in to walks like an ordinary member, so that organiser's Walks
 * link points at the member page (/walks) instead of the admin dashboard
 * (see also the matching redirect in src/app/walks/page.tsx).
 *
 * This decides what's *shown*, but it isn't the real gate — every admin
 * page and server action re-checks the specific permission itself
 * (requirePermission / permissionDenied), so a limited organiser who
 * guesses a hidden URL still gets turned away there too.
 */
export function navItems(
  isAdmin: boolean,
  walksHref: string,
  permissions?: OrganiserPermissions,
  // Site-wide switch (Settings → Display → Site chrome) — defaults true so
  // existing callers (and this file's own tests) that don't pass it keep
  // showing Progress unchanged.
  progressEnabled: boolean = true,
) {
  const perms = permissions ?? FULL_ORGANISER_PERMISSIONS;
  return [
    { href: "/", label: "Home" },
    {
      href: isAdmin && !perms.permWalksView && !perms.permWalksCreate ? "/walks" : walksHref,
      label: "Walks",
    },
    { href: "/notices", label: "Notices" },
    ...(progressEnabled ? [{ href: "/progress", label: "Progress" }] : []),
    ...(isAdmin
      ? [
          ...(perms.permMembersView ? [{ href: "/admin/members", label: "Members" }] : []),
          ...(perms.permMessages ? [{ href: "/admin/messages", label: "Messages" }] : []),
          ...(perms.permReportsView ? [{ href: "/admin/reports", label: "Reports" }] : []),
          ...(hasAnySettingsPermission(perms) ? [{ href: "/admin/settings", label: "Settings" }] : []),
          { href: "/admin/guide", label: "Guide" },
        ]
      : [{ href: "/history", label: "History" }]),
  ];
}

/**
 * What the "Settings" nav item expands to — see SettingsNavMenu in
 * site-nav-menu.tsx, which turns that one link into a dropdown listing
 * these directly, rather than always landing on the hub page first. Same
 * groups and pages as the hub (src/app/admin/settings/page.tsx), minus
 * Accident reports (already its own top-level "Reports" nav item) and
 * Guide — every organiser has full access to all of them, so there's no
 * per-item gating left to do.
 */
export const SETTINGS_MENU_GROUPS: { label: string; items: { href: string; label: string }[] }[] = [
  {
    label: "Homepage content",
    items: [
      { href: "/admin/settings/hero-photos", label: "Hero photos" },
      { href: "/admin/settings/testimonials", label: "Testimonials" },
      { href: "/admin/settings/faqs", label: "FAQs" },
      { href: "/admin/settings/branding", label: "Branding" },
      { href: "/admin/settings/homepage-layout", label: "Homepage layout" },
      { href: "/admin/settings/site-wording", label: "Site wording" },
    ],
  },
  {
    label: "Communication",
    items: [
      { href: "/admin/settings/notices", label: "Notices" },
      { href: "/admin/settings/emails", label: "Emails" },
      { href: "/admin/settings/subscribers", label: "Subscribers" },
    ],
  },
  {
    label: "Site behaviour",
    items: [
      { href: "/admin/settings/behaviour", label: "Site behaviour" },
      { href: "/admin/settings/progress", label: "Progress" },
    ],
  },
  {
    label: "Maintenance",
    items: [
      { href: "/admin/settings/retention", label: "Retention" },
      { href: "/admin/settings/cache", label: "Site cache" },
      { href: "/admin/settings/reset", label: "Reset the site" },
    ],
  },
];

/**
 * Routes that require sign-in but aren't in the middleware's public-route
 * allowlist (see proxy.ts) — a guest's Next.js Link prefetch for one of
 * these is a background fetch() that follows the middleware's redirect to
 * Clerk's cross-origin sign-in page, which the browser then blocks as a
 * CORS violation (loudly, in the console, though the visible link click
 * still works fine via a normal top-level navigation).
 *
 * Only matters for links a signed-out guest can actually see — the header
 * and mobile nav (site-nav-menu.tsx's NavLink) never need this: both only
 * render once a user is already signed in (see SiteNavLinks/SiteMobileNavBar
 * in site-nav.tsx), so those links never hit the sign-in redirect in the
 * first place and get normal prefetching. The footer shows these links to
 * everyone, guests included, so it's the one place this still applies.
 */
const AUTH_ONLY_HREFS = new Set(["/walks", "/notices", "/progress", "/history"]);

export function shouldPrefetchNavLink(href: string): boolean {
  return !AUTH_ONLY_HREFS.has(href);
}

export function isNavItemActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/walks") {
    // Individual walk pages live at their own short share URL (/w/<slug
    // or token> — see walkSharePath), not under /walks/, so they need
    // their own check here rather than falling through to the generic
    // startsWith(`${href}/`) case below.
    return pathname === "/walks" || pathname.startsWith("/w/");
  }
  if (href === "/admin") {
    return pathname === "/admin" || pathname.startsWith("/admin/walks");
  }
  if (href === "/admin/settings") {
    return pathname.startsWith("/admin/settings") || pathname.startsWith("/admin/homepage");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
