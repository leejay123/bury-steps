import { requireAnySettingsPermission, displayName } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SITE_SETTING_ID } from "@/lib/theme";
import { getSiteTheme } from "@/lib/site-theme";
import { MAX_HOMEPAGE_SLIDES } from "@/lib/slides";
import { MAX_HOMEPAGE_TESTIMONIALS } from "@/lib/testimonials";
import { MAX_HOMEPAGE_FAQS } from "@/lib/faqs";
import { EMAIL_TEMPLATES } from "@/lib/email/registry";
import { DEFAULT_CANCELLED_WALK_RETENTION_DAYS } from "@/lib/walk-retention";
import { SETTINGS_PAGE_GROUPS, SITE_WORDING_PAGES } from "@/lib/settings-pages";
import { SettingsPage } from "./settings-page";
import { SettingsHub, type SettingsHubGroup, type SettingsRowState } from "./settings-hub";

export const dynamic = "force-dynamic";

function isSet(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

function plural(count: number, noun: string): string {
  return `${count.toLocaleString("en-GB")} ${noun}${count === 1 ? "" : "s"}`;
}

function keptFor(days: number | null): string {
  return days === null ? "kept" : `${plural(days, "day")}`;
}

/**
 * The Settings home: every settings page as a grouped card table, each
 * row showing where that setting stands right now, and anything that
 * needs someone's attention flagged on its row (and summarised above the
 * table) — so whoever runs the site can see at a glance whether anything
 * is unfinished or broken, without opening every page to check.
 */
export default async function AdminSettingsPage() {
  const admin = await requireAnySettingsPermission();

  const [
    theme,
    settings,
    slideCount,
    testimonialCount,
    faqCount,
    noticeCount,
    customisedEmailCount,
    footerSubscriberCount,
    memberSubscriberCount,
  ] = await Promise.all([
    getSiteTheme(),
    prisma.siteSetting.findUnique({
      where: { id: SITE_SETTING_ID },
      select: {
        monthlyClockInGoal: true,
        progressEnabled: true,
        cancelledWalkRetentionDays: true,
        accidentReportRetentionDays: true,
        contactMessagesOwner: { select: { firstName: true, lastName: true, email: true, role: true } },
      },
    }),
    prisma.homepageSlide.count(),
    prisma.homepageTestimonial.count(),
    prisma.homepageFaq.count(),
    prisma.siteNotice.count(),
    prisma.emailTemplateOverride.count({
      where: { OR: [{ subject: { not: null } }, { body: { not: null } }] },
    }),
    prisma.newsletterSubscriber.count({ where: { unsubscribedAt: null } }),
    prisma.user.count({ where: { emailNewsletter: true } }),
  ]);

  const contactOwner =
    settings?.contactMessagesOwner?.role === "ADMIN" ? settings.contactMessagesOwner : null;
  const cancelledDays = settings ? settings.cancelledWalkRetentionDays : DEFAULT_CANCELLED_WALK_RETENTION_DAYS;
  const reportDays = settings ? settings.accidentReportRetentionDays : null;
  const goal = settings?.monthlyClockInGoal ?? null;
  const progressEnabled = settings?.progressEnabled ?? true;

  // Setup problems are written for whoever runs the site, with the
  // technical name in brackets for whoever they pass it on to.
  const rows: Record<string, SettingsRowState> = {
    "/admin/settings/branding": {
      status: theme.hasCustomLogo ? "Your own logo" : "Default logo",
    },
    "/admin/settings/hero-photos": {
      status: `${slideCount} of ${MAX_HOMEPAGE_SLIDES} photos${theme.carouselEnabled ? "" : " · hidden"}`,
      attention:
        slideCount === 0 ? "No photos yet — the top of the homepage has no picture." : undefined,
    },
    "/admin/settings/homepage-layout": {
      status: `Photos ${theme.carouselEnabled ? "on" : "off"} · Latest notices ${theme.memberNoticesEnabled ? "on" : "off"}`,
    },
    "/admin/settings/testimonials": {
      status: `${testimonialCount} of ${MAX_HOMEPAGE_TESTIMONIALS} quotes`,
    },
    "/admin/settings/faqs": { status: `${faqCount} of ${MAX_HOMEPAGE_FAQS} questions` },
    [SITE_WORDING_PAGES[0].href]: { status: plural(SITE_WORDING_PAGES.length, "page") },
    "/admin/settings/notices": { status: plural(noticeCount, "notice") },
    "/admin/settings/emails": {
      status:
        customisedEmailCount > 0
          ? `${customisedEmailCount} of ${EMAIL_TEMPLATES.length} reworded`
          : "Standard wording",
      attention: !isSet("RESEND_API_KEY")
        ? "No emails are being sent — email sending isn't set up yet (RESEND_API_KEY)."
        : !isSet("EMAIL_FROM")
          ? "Emails come from a test address that only reaches the account owner (EMAIL_FROM isn't set)."
          : undefined,
    },
    "/admin/settings/subscribers": {
      status: `${plural(footerSubscriberCount + memberSubscriberCount, "subscriber")}`,
      attention: !isSet("RESEND_WEBHOOK_SECRET")
        ? "People who unsubscribe using the link in a newsletter aren't recorded here (RESEND_WEBHOOK_SECRET isn't set)."
        : undefined,
    },
    "/admin/settings/progress": {
      status: `${goal ? `Goal: ${goal.toLocaleString("en-GB")} a month` : "No goal"}${progressEnabled ? "" : " · page hidden"}`,
    },
    "/admin/settings/behaviour": {
      status: contactOwner ? `Contact messages → ${displayName(contactOwner)}` : undefined,
      attention: contactOwner
        ? undefined
        : "No one is told when someone sends a message through the contact form.",
    },
    "/admin/settings/retention": {
      status: `Cancelled walks: ${keptFor(cancelledDays)} · Reports: ${keptFor(reportDays)}`,
      attention: !isSet("CRON_SECRET")
        ? "Automatic clean-up isn't running, including removing health notes after 90 days (CRON_SECRET isn't set)."
        : undefined,
    },
  };

  const groups: SettingsHubGroup[] = SETTINGS_PAGE_GROUPS.map((group) => ({
    label: group.label,
    danger: group.pages.every((page) => page.danger),
    pages: group.pages
      .filter((page) => admin[page.permission])
      .map(({ permission: _permission, ...page }) => ({ ...page, ...rows[page.href] })),
  })).filter((group) => group.pages.length > 0);

  return (
    <SettingsPage
      description="Everything about how the site looks and works. Each row shows where that setting stands now — open one to change it."
      showBackLink={false}
      title="Settings"
    >
      <SettingsHub groups={groups} />
    </SettingsPage>
  );
}
