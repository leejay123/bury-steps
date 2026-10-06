import { cacheLife, cacheTag } from "next/cache";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { HOMEPAGE_CACHE_TAG, HOMEPAGE_REVALIDATE_SECONDS } from "@/lib/homepage-cache";
import { photoBlur } from "@/lib/photo-blur";
import { DEFAULT_HERO_PATH, slideSrc, type SlideView } from "@/lib/slides";

const FALLBACK_SLIDES: SlideView[] = [
  {
    id: "default",
    sortOrder: 0,
    alt: "Bury Steps Walking Group",
    src: DEFAULT_HERO_PATH,
    heading: "",
    caption: "",
    blur: null,
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

async function blurForSlide(row: {
  id: string;
  imageBlur: string | null;
  imagePath: string | null;
}): Promise<string | null> {
  if (row.imageBlur) return row.imageBlur;
  let bytes: Uint8Array | null = null;
  if (row.imagePath && row.imagePath.startsWith("/") && !row.imagePath.includes("..")) {
    try {
      bytes = await readFile(path.join(process.cwd(), "public", row.imagePath.slice(1)));
    } catch {
      bytes = null;
    }
  } else {
    const stored = await prisma.homepageSlide.findUnique({
      where: { id: row.id },
      select: { imageData: true },
    });
    bytes = stored?.imageData ?? null;
  }
  if (!bytes || bytes.length === 0) return null;
  const blur = await photoBlur(bytes);
  if (!blur) return null;
  await prisma.homepageSlide.update({ where: { id: row.id }, data: { imageBlur: blur } }).catch((err) => {
    console.error("Could not store a photo preview", row.id, err);
  });
  return blur;
}

async function loadHomepageSlides(): Promise<SlideView[]> {
  const rows = await prisma.homepageSlide.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      sortOrder: true,
      alt: true,
      heading: true,
      caption: true,
      imagePath: true,
      imageBlur: true,
      updatedAt: true,
    },
  });

  if (rows.length === 0) return FALLBACK_SLIDES;

  return Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      sortOrder: row.sortOrder,
      alt: row.alt,
      src: slideSrc(row),
      heading: row.heading,
      caption: row.caption,
      blur: await blurForSlide(row),
    })),
  );
}

/** Saved copy (Next.js "use cache: remote" — one copy shared by every server, so a save refreshes it everywhere): refreshed every HOMEPAGE_REVALIDATE_SECONDS, and at once
 * when a setting is saved (revalidateTag on its tag). */
async function getCachedHomepageSlides() {
  "use cache: remote";
  cacheTag(HOMEPAGE_CACHE_TAG);
  cacheLife({ revalidate: HOMEPAGE_REVALIDATE_SECONDS });
  return loadHomepageSlides();
}

export async function getHomepageSlides(): Promise<SlideView[]> {
  try {
    return await getCachedHomepageSlides();
  } catch {
    return FALLBACK_SLIDES;
  }
}
