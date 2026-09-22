import {
  AlertTriangle,
  Bell,
  BookOpen,
  ClipboardList,
  HelpCircle,
  ImageIcon,
  Mail,
  Palette,
  Quote,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import { requireAnySettingsPermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MAX_HOMEPAGE_SLIDES } from "@/lib/slides";
import { MAX_HOMEPAGE_TESTIMONIALS } from "@/lib/testimonials";
import { MAX_FAQ_CATEGORIES, MAX_HOMEPAGE_FAQS } from "@/lib/faqs";
import { BELL_NOTICE_LIMIT } from "@/lib/notices";
import { AdminPageIntro } from "../admin-page-intro";
import { FullWidthDivider } from "@/components/full-width-divider";
import { SettingsGrid, type SettingsGridGroup } from "./settings-grid";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const admin = await requireAnySettingsPermission();

  const [slideCount, testimonialCount, faqCount, noticeCount] = await Promise.all([
    prisma.homepageSlide.count(),
    prisma.homepageTestimonial.count(),
    prisma.homepageFaq.count().catch(() => 0),
    prisma.siteNotice.count().catch(() => 0),
  ]);

  const groups: SettingsGridGroup[] = [
    {
      label: "Homepage content",
      items: admin.permHomepage
        ? [
            {
              href: "/admin/settings/hero-photos",
              title: "Hero photos",
              description: `Homepage carousel. ${slideCount} of ${MAX_HOMEPAGE_SLIDES} slides.`,
              icon: ImageIcon,
            },
            {
              href: "/admin/settings/testimonials",
              title: "Testimonials",
              description: `Quotes on the homepage. ${testimonialCount} of ${MAX_HOMEPAGE_TESTIMONIALS}.`,
              icon: Quote,
            },
            {
              href: "/admin/settings/faqs",
              title: "FAQs",
              description: `Questions on the homepage. ${faqCount} of ${MAX_HOMEPAGE_FAQS}, in up to ${MAX_FAQ_CATEGORIES} categories.`,
              icon: HelpCircle,
            },
          ]
        : [],
    },
    {
      label: "Communication",
      items: [
        ...(admin.permNotices
          ? [
              {
                href: "/admin/settings/notices",
                title: "Notices",
                description: `Member bell (welcome + ${BELL_NOTICE_LIMIT} newest) and full-page notices. ${noticeCount} total.`,
                icon: Bell,
              },
            ]
          : []),
        ...(admin.permEmails
          ? [
              {
                href: "/admin/settings/emails",
                title: "Emails",
                description:
                  "Edit the subject and wording the site sends for each email — signup, walks, contact form, and more.",
                icon: Mail,
              },
            ]
          : []),
        ...(admin.permSubscribers
          ? [
              {
                href: "/admin/settings/subscribers",
                title: "Subscribers",
                description: "Who's opted into the newsletter and walk emails, and an export for Resend campaigns.",
                icon: Users,
              },
            ]
          : []),
      ],
    },
    {
      label: "Site behaviour",
      items: [
        ...(admin.permDisplay
          ? [
              {
                href: "/admin/settings/display",
                title: "Display",
                description:
                  "Site name, tagline, Facebook link, homepage copy and section order, cookie notice, and back to top.",
                icon: Palette,
              },
            ]
          : []),
        ...(admin.permProgress
          ? [
              {
                href: "/admin/settings/progress",
                title: "Progress",
                description: "Optional monthly together goal for signed-in members.",
                icon: TrendingUp,
              },
            ]
          : []),
      ],
    },
    {
      label: "Maintenance",
      items: admin.permCacheReset
        ? [
            {
              href: "/admin/settings/cache",
              title: "Site cache",
              description: "Refresh the public homepage if it still shows old content.",
              icon: RefreshCw,
            },
            {
              href: "/admin/settings/reset",
              title: "Reset the site",
              description: "Delete all walks, members, and homepage edits. You stay the organiser.",
              icon: AlertTriangle,
              tone: "danger" as const,
            },
          ]
        : [],
    },
    {
      label: "More",
      items: [
        ...(admin.permReportsView
          ? [
              {
                href: "/admin/reports",
                title: "Accident reports",
                description: "Record what happened on a walk, then print or save as PDF.",
                icon: ClipboardList,
              },
            ]
          : []),
        {
          href: "/admin/guide",
          title: "Guide",
          description: "How to use this site as an organiser.",
          icon: BookOpen,
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col">
      <div className="relative px-4 py-6 md:px-6">
        <AdminPageIntro
          description="Homepage photos, quotes, FAQs, notices, Progress, display, cache, and reset."
          title="Settings"
        />
        <FullWidthDivider position="bottom" />
      </div>
      <div className="px-4 py-6 md:px-6">
        <SettingsGrid groups={groups} />
      </div>
    </div>
  );
}
