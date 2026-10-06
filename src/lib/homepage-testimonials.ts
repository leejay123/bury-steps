import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/db";
import { HOMEPAGE_CACHE_TAG, HOMEPAGE_REVALIDATE_SECONDS } from "@/lib/homepage-cache";
import { photoBlur } from "@/lib/photo-blur";
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
      imageBlur: true,
      updatedAt: true,
    },
  });

  return Promise.all(
    rows.map(async (row) => {
      let blur = row.imageBlur;
      if (!blur && row.imageMime && !row.imagePath) {
        const stored = await prisma.homepageTestimonial.findUnique({
          where: { id: row.id },
          select: { imageData: true },
        });
        if (stored?.imageData && stored.imageData.length > 0) {
          blur = await photoBlur(stored.imageData);
          if (blur) {
            await prisma.homepageTestimonial
              .update({ where: { id: row.id }, data: { imageBlur: blur } })
              .catch((err) => console.error("Could not store a photo preview", row.id, err));
          }
        }
      }
      return {
        id: row.id,
        sortOrder: row.sortOrder,
        name: row.name,
        role: row.role,
        quote: row.quote,
        image: testimonialSrc(row),
        blur,
      };
    }),
  );
}

/** Saved copy (Next.js "use cache: remote" — one copy shared by every server, so a save refreshes it everywhere): refreshed every HOMEPAGE_REVALIDATE_SECONDS,
 * and at once when testimonials are saved (revalidateTag on its tag). */
async function getCachedHomepageTestimonials() {
  "use cache: remote";
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
