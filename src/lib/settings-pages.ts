import type { OrganiserPermissions } from "./organiser-permissions";

/**
 * The one list of every Settings page — the hub's card table
 * (src/app/admin/settings/page.tsx) and each page's own header (the
 * group name above its title, via SettingsPage) both read from here, so
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

export const SITE_WORDING_PAGES: SettingsPageLink[] = [
  {
    href: "/admin/settings/site-wording/how-this-started",
    title: "How this started",
    description: "The heading, short blurb and full story for the homepage's How this started section.",
    keywords: "story about eyebrow teaser",
  },
  {
    href: "/admin/settings/site-wording/about-lists",
    title: "About lists",
    description: "The goals, places, what to expect and group rules in the homepage's About drawer.",
    keywords: "rules goals places expect drawer",
  },
  {
    href: "/admin/settings/site-wording/testimonials",
    title: "Testimonials heading",
    description: "The heading and intro above the quotes on the homepage.",
    keywords: "quotes eyebrow",
  },
  {
    href: "/admin/settings/site-wording/faqs",
    title: "FAQ heading",
    description: "The heading and intro above the questions on the homepage.",
    keywords: "questions",
  },
  {
    href: "/admin/settings/site-wording/walk-page-cards",
    title: "Walk page cards",
    description: "Edit or hide the Before you set off and How this group works cards on each walk's page.",
    keywords: "tips steps before you set off how walks work",
  },
];

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
        description: "Choose the order of the homepage sections, and show or hide the photos and latest notices.",
        keywords: "order sections carousel reorder",
        permission: "permDisplay",
      },
      {
        href: "/admin/settings/testimonials",
        title: "Testimonials",
        description: "Quotes from members shown on the homepage.",
        keywords: "quotes reviews",
        permission: "permHomepage",
      },
      {
        href: "/admin/settings/faqs",
        title: "FAQs",
        description: "The questions and answers on the homepage, grouped into categories.",
        keywords: "questions answers help",
        permission: "permHomepage",
      },
      {
        href: SITE_WORDING_PAGES[0].href,
        title: "Site wording",
        description: "Change the wording of the homepage sections and walk pages.",
        keywords: "text copy words",
        permission: "permDisplay",
        children: SITE_WORDING_PAGES,
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
        href: "/admin/settings/subscribers",
        title: "Subscribers",
        description: "Who gets which emails, send a newsletter, and download the list.",
        keywords: "newsletter mailing list export csv resend campaign unsubscribe",
        permission: "permSubscribers",
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
        href: "/admin/settings/behaviour",
        title: "Site behaviour",
        description: "Cookie notice, back-to-top button, the Progress page, organiser invites and who gets contact messages.",
        keywords: "cookie consent back to top contact form invite organiser progress page",
        permission: "permDisplay",
      },
      {
        href: "/admin/settings/retention",
        title: "Data retention",
        description: "How long cancelled walks and accident reports are kept before they're deleted automatically.",
        keywords: "delete auto-delete privacy gdpr keep",
        permission: "permCacheReset",
      },
      {
        href: "/admin/settings/cache",
        title: "Refresh the homepage",
        description: "Use this if the homepage still shows old photos, quotes or questions after you've saved changes.",
        keywords: "cache clear old stale",
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
        description: "Delete every walk, member, message, subscriber and homepage change, and start again from scratch. This can't be undone.",
        keywords: "wipe delete everything start over messages subscribers",
        permission: "permCacheReset",
        danger: true,
      },
    ],
  },
];

/** The group and page a settings URL belongs to — a Site wording sub-page
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
