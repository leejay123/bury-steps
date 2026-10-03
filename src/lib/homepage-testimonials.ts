import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/db";
import { HOMEPAGE_CACHE_TAG, HOMEPAGE_REVALIDATE_SECONDS } from "@/lib/homepage-cache";
import { testimonialSrc, type TestimonialView } from "@/lib/testimonials";

async function loadHomepageTestimonials(): Promise<TestimonialView[]> {
  const rows = await prisma.homepageTestimonial.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      sortOrder: true,
      name: true,
      role: true,
      quote: true,
      imagePath: true,
      imageMime: true,
      updatedAt: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    sortOrder: row.sortOrder,
    name: row.name,
    role: row.role,
    quote: row.quote,
    image: testimonialSrc(row),
  }));
}

/** Saved copy (Next.js "use cache"): refreshed every HOMEPAGE_REVALIDATE_SECONDS,
 * and at once when testimonials are saved (revalidateTag on its tag). */
async function getCachedHomepageTestimonials() {
  "use cache";
  cacheTag(HOMEPAGE_CACHE_TAG);
  cacheLife({ revalidate: HOMEPAGE_REVALIDATE_SECONDS });
  return loadHomepageTestimonials();
}

export async function getHomepageTestimonials(): Promise<TestimonialView[]> {
  try {
    return await getCachedHomepageTestimonials();
  } catch {
    return [];
  }
}
