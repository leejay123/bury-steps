import type { OrganiserPermissions } from "./organiser-permissions";

/**
 * The one list of every Settings page — the hub's card table
 * (src/app/admin/settings/page.tsx) and the top-bar trail (Settings ›
 * group › this page) both read from here, so
 * adding or renaming a page is a one-place change.
 *
 * Plain data only (no icon components) so a server component can pass it
 * straight to a client one — icons are looked up by `href` in
 * src/components/settings-page-icons.tsx.
 */

export type SettingsPageLink = {
  href: string;
  title: string;
  /** One plain-English line for the hub's card table. */
  description: string;
  /** Extra words the hub's search matches on, for things someone might
   * look for by what's *on* the page rather than its name. */
  keywords?: string;
};

export type SettingsPageEntry = SettingsPageLink & {
  permission: keyof OrganiserPermissions;
  /** Irreversible — shown in its own red "Danger zone" group. */
  danger?: boolean;
  /** Sub-pages, listed under this row on the hub and as tabs on each one. */
  children?: SettingsPageLink[];
};

export type SettingsPageGroup = { label: string; pages: SettingsPageEntry[] };

export const SETTINGS_PAGE_GROUPS: SettingsPageGroup[] = [
  {
    label: "Homepage",
    pages: [
      {
        href: "/admin/settings/branding",
        title: "Branding",
        description: "The site's name, tagline, logo, browser-tab icon and Facebook link.",
        keywords: "logo favicon icon name tagline facebook report banner",
        permission: "permDisplay",
      },
      {
        href: "/admin/settings/hero-photos",
        title: "Hero photos",
        description: "The photos that rotate at the top of the homepage.",
        keywords: "carousel slides images pictures",
        permission: "permHomepage",
      },
      {
        href: "/admin/settings/homepage-layout",
        title: "Homepage layout",
        description: "Show or hide homepage sections, and optional background patterns behind them.",
        keywords: "sections carousel photo slider background patterns animate titles latest notices",
        permission: "permDisplay",
      },
      {
        href: "/admin/settings/testimonials",
        title: "Testimonials",
        description: "Quotes from members shown on the homepage.",
        keywords: "quotes reviews heading intro",
        permission: "permHomepage",
      },
      {
        href: "/admin/settings/faqs",
        title: "FAQs",
        description: "The questions and answers on the homepage, grouped into categories.",
        keywords: "questions answers help heading intro",
        permission: "permHomepage",
      },
      // Each homepage heading is edited on the page of the thing it labels (FAQs, Testimonials);
      // the rest of the wording has its own pages here (once "Site wording", under tabs).
      {
        href: "/admin/settings/site-wording/how-this-started",
        title: "How this started",
        description: "The heading, short blurb and full story for the homepage's How this started section.",
        keywords: "story about eyebrow teaser wording text copy",
        permission: "permDisplay",
      },
      {
        href: "/admin/settings/site-wording/about-lists",
        title: "About lists",
        description: "The goals, places, what to expect and group rules in the homepage's About drawer.",
        keywords: "rules goals places expect drawer wording text copy",
        permission: "permDisplay",
      },
      {
        href: "/admin/settings/site-wording/walk-page-cards",
        title: "Walk page cards",
        description: "Edit the shared wording on walk pages. Layout and which blocks show are set in the walk page designer.",
        keywords: "tips steps before you set off how walks work walk page design wording status",
        permission: "permDisplay",
      },
    ],
  },
  {
    label: "Members & emails",
    pages: [
      {
        href: "/admin/settings/notices",
        title: "Notices",
        description: "Messages members see in the bell and on the Notices page.",
        keywords: "bell announcements welcome popup news",
        permission: "permNotices",
      },
      {
        href: "/admin/settings/emails",
        title: "Emails",
        description: "The subject and wording of every email the site sends.",
        keywords: "templates wording subject welcome",
        permission: "permEmails",
      },
      {
        href: "/admin/settings/progress",
        title: "Progress",
        description: "An optional group goal for clock-ins each month.",
        keywords: "goal target together monthly",
        permission: "permProgress",
      },
    ],
  },
  {
    label: "How the site works",
    pages: [
      {
        href: "/admin/settings/walk-essentials",
        title: "Walk essentials",
        description: "The tick boxes under Essentials on each walk — rename them, change icons, add or remove.",
        keywords: "toilets parking cafe dogs facilities amenities stiles boots",
        permission: "permWalksEdit",
      },
      {
        href: "/admin/settings/behaviour",
        title: "Site behaviour",
        description: "Join bar, cookie notice, footer name, the Progress page, clock-in, organiser invites and who gets contact messages.",
        keywords: "cookie consent contact form invite organiser progress page emergency contact clock-in join bar banner footer big name wordmark",
        permission: "permDisplay",
      },
      {
        href: "/admin/settings/retention",
        title: "Data retention",
        description: "How long cancelled walks and accident reports are kept before they're deleted automatically.",
        keywords: "delete auto-delete privacy gdpr keep",
        permission: "permCacheReset",
      },
    ],
  },
  {
    label: "Danger zone",
    pages: [
      {
        href: "/admin/settings/reset",
        title: "Reset the site",
        description: "Delete every walk, member, message and homepage change, and start again from scratch. This can't be undone.",
        keywords: "wipe delete everything start over messages",
        permission: "permCacheReset",
        danger: true,
      },
    ],
  },
];

/** The group and page a settings URL belongs to — a sub-page (none now)
 * resolves to its parent entry. Null for anything outside the registry. */
export function findSettingsPage(
  pathname: string,
): { group: SettingsPageGroup; page: SettingsPageEntry } | null {
  for (const group of SETTINGS_PAGE_GROUPS) {
    for (const page of group.pages) {
      if (page.href === pathname || page.children?.some((child) => child.href === pathname)) {
        return { group, page };
      }
    }
  }
  return null;
}

/** Trail for a nested settings page (Settings › group › this page). Null on
 * the Settings hub itself, and for URLs that aren't a settings page. */
export function settingsHeaderTrail(
  pathname: string,
): { group: string; title: string; danger: boolean } | null {
  if (pathname === "/admin/settings") return null;
  const found = findSettingsPage(pathname);
  if (!found) return null;
  const child = found.page.children?.find((item) => item.href === pathname);
  return {
    group: found.group.label,
    title: child?.title ?? found.page.title,
    danger: Boolean(found.page.danger),
  };
}
