import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MAX_HOMEPAGE_SLIDES, slideSrc } from "@/lib/slides";
import { AdminNav } from "../admin-nav";
import { HomepageSlideManager } from "./slide-manager";

export const dynamic = "force-dynamic";

export default async function AdminHomepagePage() {
  await requireAdmin();

  const rows = await prisma.homepageSlide.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, sortOrder: true, alt: true, imagePath: true, updatedAt: true },
  });

  const slides = rows.map((row) => ({
    id: row.id,
    sortOrder: row.sortOrder,
    alt: row.alt,
    src: slideSrc(row),
  }));

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Homepage</h1>
        <AdminNav current="homepage" />
      </div>
      <p className="text-sm text-muted-foreground">
        The slideshow at the top of the public homepage. You can keep up to {MAX_HOMEPAGE_SLIDES}{" "}
        slides, change each picture, and move them into the order visitors will see.
      </p>
      <HomepageSlideManager slides={slides} maxSlides={MAX_HOMEPAGE_SLIDES} />
    </div>
  );
}
