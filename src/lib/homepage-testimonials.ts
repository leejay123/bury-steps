import { unstable_cache } from "next/cache";
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

const getCachedHomepageTestimonials = unstable_cache(
  loadHomepageTestimonials,
  ["homepage-testimonials"],
  {
    tags: [HOMEPAGE_CACHE_TAG],
    revalidate: HOMEPAGE_REVALIDATE_SECONDS,
  },
);

export async function getHomepageTestimonials(): Promise<TestimonialView[]> {
  try {
    return await getCachedHomepageTestimonials();
  } catch {
    return [];
  }
}
