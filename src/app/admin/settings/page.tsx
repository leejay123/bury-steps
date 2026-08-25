import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MAX_HOMEPAGE_SLIDES } from "@/lib/slides";
import { MAX_HOMEPAGE_TESTIMONIALS } from "@/lib/testimonials";
import { MAX_HOMEPAGE_FAQS } from "@/lib/faqs";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdmin();

  const [slideCount, testimonialCount, faqCount] = await Promise.all([
    prisma.homepageSlide.count(),
    prisma.homepageTestimonial.count(),
    prisma.homepageFaq.count().catch(() => 0),
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
      description: `Questions on the homepage. ${faqCount} of ${MAX_HOMEPAGE_FAQS}.`,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <Link className="block" href={item.href} key={item.href}>
          <Card className="h-full transition-colors hover:bg-accent/40">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div className="flex flex-col gap-1.5">
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </div>
              <ChevronRight className="mt-0.5 shrink-0 text-muted-foreground" />
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
