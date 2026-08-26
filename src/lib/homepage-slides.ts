import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { HOMEPAGE_CACHE_TAG, HOMEPAGE_REVALIDATE_SECONDS } from "@/lib/homepage-cache";
import { DEFAULT_HERO_PATH, slideSrc, type SlideView } from "@/lib/slides";

const FALLBACK_SLIDES: SlideView[] = [
  {
    id: "default",
    sortOrder: 0,
    alt: "Bury Steps Walking Group",
    src: DEFAULT_HERO_PATH,
  },
];

/** If organisers have not added slides yet, keep the bundled hero photo as slide 1 so they can replace it in admin. */
export async function ensureDefaultHomepageSlide() {
  const count = await prisma.homepageSlide.count();
  if (count > 0) return;

  try {
    await prisma.homepageSlide.create({
      data: {
        sortOrder: 0,
        alt: "Bury Steps Walking Group",
        imagePath: DEFAULT_HERO_PATH,
      },
    });
  } catch {
    // Another request may have created it at the same time.
  }
}

async function loadHomepageSlides(): Promise<SlideView[]> {
  const rows = await prisma.homepageSlide.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, sortOrder: true, alt: true, imagePath: true, updatedAt: true },
  });

  if (rows.length === 0) return FALLBACK_SLIDES;

  return rows.map((row) => ({
    id: row.id,
    sortOrder: row.sortOrder,
    alt: row.alt,
    src: slideSrc(row),
  }));
}

const getCachedHomepageSlides = unstable_cache(loadHomepageSlides, ["homepage-slides"], {
  tags: [HOMEPAGE_CACHE_TAG],
  revalidate: HOMEPAGE_REVALIDATE_SECONDS,
});

export async function getHomepageSlides(): Promise<SlideView[]> {
  try {
    return await getCachedHomepageSlides();
  } catch {
    return FALLBACK_SLIDES;
  }
}
