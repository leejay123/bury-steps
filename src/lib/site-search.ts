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

export type SiteSearchGroup = {
  id: "pages" | "walks" | "notices" | "faqs" | "settings";
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

  const pages: SiteSearchItem[] = [
    ...navItems(isAdmin, isAdmin ? "/admin" : "/walks", perms, progressEnabled).map((item) => ({
      label: item.label,
      href: item.href,
    })),
    ...(isAdmin ? [{ label: "History", href: "/history" }] : []),
    { label: "Email preferences", href: "/email-preferences", keywords: ["unsubscribe", "emails"] },
    { label: "Contact us", href: "/contact", keywords: ["message", "help"] },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms-of-service" },
  ];

  const settings: SiteSearchItem[] = perms
    ? SETTINGS_PAGE_GROUPS.flatMap((group) =>
        group.pages
          .filter((page) => perms[page.permission])
          .flatMap((page) => [
            { label: page.title, href: page.href, hint: group.label, keywords: [page.description, page.keywords ?? ""] },
            ...(page.children ?? []).map((child) => ({
              label: child.title,
              href: child.href,
              hint: page.title,
              keywords: [child.description, child.keywords ?? ""],
            })),
          ]),
      )
    : [];

  const groups: SiteSearchGroup[] = [
    { id: "pages", heading: "Pages", items: pages },
    {
      id: "walks",
      heading: "Walks",
      items: walks.map((walk) => ({
        label: walk.title,
        href: canAdminWalks ? `/admin/walks/${walk.id}` : walkSharePath(walk),
        hint: formatWalkDate(walk.startsAt),
        keywords: [walk.location ?? ""],
      })),
    },
    {
      id: "notices",
      heading: "Notices",
      items: notices.map((notice) => ({
        label: notice.title,
        href: notice.slug ? `/notices/${notice.slug}` : "/notices",
        keywords: [notice.categoryLabel ?? "", notice.body.slice(0, 200)],
      })),
    },
    {
      id: "faqs",
      heading: "FAQs",
      items: faqData.faqs.map((faq) => ({
        label: faq.question,
        href: "/#faqs",
        keywords: [faq.categoryLabel, faq.answer.slice(0, 200)],
      })),
    },
    { id: "settings", heading: "Settings", items: settings },
  ];

  return groups.filter((group) => group.items.length > 0);
}
