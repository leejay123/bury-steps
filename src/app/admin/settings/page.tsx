import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MAX_HOMEPAGE_SLIDES } from "@/lib/slides";
import { MAX_HOMEPAGE_TESTIMONIALS } from "@/lib/testimonials";
import { MAX_FAQ_CATEGORIES, MAX_HOMEPAGE_FAQS } from "@/lib/faqs";
import { MAX_SITE_NOTICES } from "@/lib/notices";
import { AdminPageIntro } from "../admin-page-intro";
import { FullWidthDivider } from "@/components/full-width-divider";
import { SettingsGrid } from "./settings-grid";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdmin();

  const [slideCount, testimonialCount, faqCount, noticeCount] = await Promise.all([
    prisma.homepageSlide.count(),
    prisma.homepageTestimonial.count(),
    prisma.homepageFaq.count().catch(() => 0),
    prisma.siteNotice.count().catch(() => 0),
  ]);

  const items = [
    {
      href: "/admin/settings/hero-photos",
      title: "Hero photos",
      description: `Homepage carousel. ${slideCount} of ${MAX_HOMEPAGE_SLIDES} slides.`,
    },
    {
      href: "/admin/settings/testimonials",
      title: "Testimonials",
      description: `Quotes on the homepage. ${testimonialCount} of ${MAX_HOMEPAGE_TESTIMONIALS}.`,
    },
    {
      href: "/admin/settings/faqs",
      title: "FAQs",
      description: `Questions on the homepage. ${faqCount} of ${MAX_HOMEPAGE_FAQS}, in up to ${MAX_FAQ_CATEGORIES} categories.`,
    },
    {
      href: "/admin/settings/notices",
      title: "Notices",
      description: `Messages in the bell. ${noticeCount} of ${MAX_SITE_NOTICES}.`,
    },
    {
      href: "/admin/settings/appearance",
      title: "Site colour",
      description: "Buttons, links, and highlights across the site.",
    },
    {
      href: "/admin/guide",
      title: "Guide",
      description: "How to use this site as an organiser.",
    },
  ];

  return (
    <div className="flex flex-col">
      <div className="relative px-4 py-6 md:px-8">
        <AdminPageIntro
          description="Homepage photos, quotes, FAQs, notices, and the site colour."
          title="Settings"
        />
        <FullWidthDivider position="bottom" />
      </div>
      <SettingsGrid items={items} />
    </div>
  );
}
