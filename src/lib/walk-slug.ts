import { customAlphabet } from "nanoid";
import { prisma } from "@/lib/db";

const TITLE_SLUG_MAX = 48;
const NAME_WORD_MAX = 12;
const SKIP_WORDS = new Set(["the", "a", "an", "and", "of", "at", "to", "from"]);
/** Unguessable suffix so public /w/{slug} links cannot be enumerated from place names. */
const slugSuffix = customAlphabet("abcdefghjkmnpqrstuvwxyz23456789", 6);

/** Lowercase hyphenated title, letters and digits only. */
export function slugifyWalkTitle(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, TITLE_SLUG_MAX)
    .replace(/-+$/g, "");
}

function shortWalkName(title: string): string {
  const word = slugifyWalkTitle(title)
    .split("-")
    .find((part) => part.length >= 2 && !/^\d+$/.test(part) && !SKIP_WORDS.has(part));
  return word ? word.slice(0, NAME_WORD_MAX) : "";
}

/** Short share slug base: “burrs”. First place word only — no date. */
export function walkSlugBase(title: string): string {
  return shortWalkName(title) || "walk";
}

export function walkSharePath(walk: { slug?: string | null; token: string }): string {
  return `/w/${walk.slug || walk.token}`;
}

export function walkShareUrl(
  origin: string,
  walk: { slug?: string | null; token: string },
): string {
  return `${origin}${walkSharePath(walk)}`;
}

/**
 * Readable-but-unguessable share slug: `burrs-x7k2m9`. Place word for humans;
 * random suffix so guests cannot enumerate walks from common titles.
 */
export async function allocateWalkSlug(title: string, excludeId?: string): Promise<string> {
  const base = walkSlugBase(title);
  for (let n = 0; n < 25; n++) {
    const slug = `${base}-${slugSuffix()}`;
    const taken = await prisma.walk.findFirst({
      where: {
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (!taken) return slug;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/** Fill in a slug for older walks that were created before readable links. */
export async function ensureWalkSlug(walk: {
  id: string;
  title: string;
  slug: string | null;
}): Promise<string> {
  if (walk.slug) return walk.slug;
  const slug = await allocateWalkSlug(walk.title, walk.id);
  try {
    await prisma.walk.update({ where: { id: walk.id }, data: { slug } });
    return slug;
  } catch {
    const fresh = await prisma.walk.findUnique({
      where: { id: walk.id },
      select: { slug: true },
    });
    return fresh?.slug ?? slug;
  }
}
