import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatWalkDate } from "@/lib/dates";
import { getHomepageFaqData } from "@/lib/homepage-faqs";
import { FULL_ORGANISER_PERMISSIONS, ORGANISER_PERMISSIONS } from "@/lib/organiser-permissions";
import { getProgressEnabled } from "@/lib/progress-settings";
import { SETTINGS_PAGE_GROUPS } from "@/lib/settings-pages";
import { getSiteNoticeState } from "@/lib/site-notices";
import { walkSharePath } from "@/lib/walk-slug";
import { navItems } from "@/components/site-nav-items";

export type SiteSearchItem = {
  label: string;
  href: string;
  /** Extra words cmdk matches on but doesn't show (dates, places, answers). */
  keywords?: string[];
  hint?: string;
};

export type SiteSearchKind = "pages" | "walks" | "notices" | "faqs" | "settings";

export type SiteSearchGroup = {
  id: string;
  /** Picks the icon, and "pages" groups are what shows before you type. */
  kind: SiteSearchKind;
  heading: string;
  items: SiteSearchItem[];
};

/**
 * Everything the header search can jump to, limited to what this person may
 * open: members get member pages, organisers only the admin pages their
 * permissions allow (the pages themselves still re-check on load). Members
 * aren't listed one by one — the Members page link covers that.
 */
export async function buildSiteSearchIndex(user: User): Promise<SiteSearchGroup[]> {
  const isAdmin = user.role === "ADMIN";
  const perms = isAdmin ? (user.isOwner ? FULL_ORGANISER_PERMISSIONS : ORGANISER_PERMISSIONS) : undefined;
  const canAdminWalks = Boolean(perms && (perms.permWalksView || perms.permWalksCreate));

  const [progressEnabled, { notices }, faqData, walks] = await Promise.all([
    getProgressEnabled(),
    getSiteNoticeState(user.id, user.firstName),
    getHomepageFaqData().catch(() => ({ faqs: [], categories: [] })),
    prisma.walk.findMany({
      where: { cancelledAt: null, startsAt: { gt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60) } },
      orderBy: { startsAt: "asc" },
      select: { id: true, slug: true, token: true, title: true, startsAt: true, location: true },
      take: 40,
    }),
  ]);

  const mainPages: SiteSearchItem[] = navItems(isAdmin, isAdmin ? "/admin" : "/walks", perms, progressEnabled)
    .filter((item) => !item.href.startsWith("/admin/"))
    .map((item) => ({ label: item.label, href: item.href }));
  const managePages: SiteSearchItem[] = navItems(isAdmin, "/admin", perms, progressEnabled)
    .filter((item) => item.href.startsWith("/admin/"))
    .map((item) => ({ label: item.label, href: item.href }));
  const accountPages: SiteSearchItem[] = [
    ...(isAdmin ? [{ label: "History", href: "/history" }] : []),
    { label: "Email preferences", href: "/email-preferences", keywords: ["unsubscribe", "emails"] },
  ];
  const helpPages: SiteSearchItem[] = [
    { label: "Contact us", href: "/contact", keywords: ["message", "help"] },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms-of-service" },
  ];

  const now = Date.now();
  const walkItem = (walk: (typeof walks)[number]): SiteSearchItem => ({
    label: walk.title,
    href: canAdminWalks ? `/admin/walks/${walk.id}` : walkSharePath(walk),
    hint: formatWalkDate(walk.startsAt),
    keywords: [walk.location ?? ""],
  });

  // Settings split by the hub's own groups (Homepage, Members…).
  const settingsGroups: SiteSearchGroup[] = perms
    ? SETTINGS_PAGE_GROUPS.map((group) => ({
        id: `settings:${group.label}`,
        kind: "settings" as const,
        heading: `Settings · ${group.label}`,
        items: group.pages
          .filter((page) => perms[page.permission])
          .flatMap((page) => [
            { label: page.title, href: page.href, keywords: [page.description, page.keywords ?? ""] },
            ...(page.children ?? []).map((child) => ({
              label: child.title,
              href: child.href,
              hint: page.title,
              keywords: [child.description, child.keywords ?? ""],
            })),
          ]),
      }))
    : [];

  // FAQs split by their own categories.
  const faqCategories = [...new Set(faqData.faqs.map((faq) => faq.categoryLabel))];

  const groups: SiteSearchGroup[] = [
    { id: "main", kind: "pages", heading: "Pages", items: mainPages },
    { id: "manage", kind: "pages", heading: "Manage", items: managePages },
    { id: "account", kind: "pages", heading: "Your account", items: accountPages },
    { id: "help", kind: "pages", heading: "Help & info", items: helpPages },
    {
      id: "walks-upcoming",
      kind: "walks",
      heading: "Upcoming walks",
      items: walks.filter((walk) => walk.startsAt.getTime() >= now).map(walkItem),
    },
    {
      id: "walks-past",
      kind: "walks",
      heading: "Recent walks",
      items: walks
        .filter((walk) => walk.startsAt.getTime() < now)
        .reverse()
        .map(walkItem),
    },
    {
      id: "notices",
      kind: "notices",
      heading: "Notices",
      items: notices.map((notice) => ({
        label: notice.title,
        href: notice.slug ? `/notices/${notice.slug}` : "/notices",
        hint: notice.categoryLabel ?? undefined,
        keywords: [notice.categoryLabel ?? "", notice.body.slice(0, 200)],
      })),
    },
    ...faqCategories.map((category) => ({
      id: `faqs:${category}`,
      kind: "faqs" as const,
      heading: faqCategories.length > 1 ? `FAQs · ${category}` : "FAQs",
      items: faqData.faqs
        .filter((faq) => faq.categoryLabel === category)
        .map((faq) => ({ label: faq.question, href: "/#faqs", keywords: [faq.answer.slice(0, 200)] })),
    })),
    ...settingsGroups,
  ];

  return groups.filter((group) => group.items.length > 0);
}
