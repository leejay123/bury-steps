import { customAlphabet } from "nanoid";
import { prisma } from "@/lib/db";
import { WALK_SLUG_CODE_ALPHABET, walkSlugBase, walkSlugCode } from "@/lib/walk-slug";

/** Unguessable suffix so public /w/{slug} links cannot be enumerated from place names. */
const slugSuffix = customAlphabet(WALK_SLUG_CODE_ALPHABET, 6);

/**
 * Readable-but-unguessable share slug: `burrs-x7k2m9`. Place word for humans;
 * random suffix so guests cannot enumerate walks from common titles.
 */
export async function allocateWalkSlug(title: string, excludeId?: string): Promise<string> {
  const base = walkSlugBase(title);
  for (let n = 0; n < 25; n++) {
    const code = slugSuffix();
    // The code alone must be unused: a walk keeps its code when renamed,
    // and old links are found by it.
    const taken = await prisma.walk.findFirst({
      where: {
        slug: { endsWith: `-${code}` },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (!taken) return `${base}-${code}`;
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
  // Only the first concurrent claim wins — a plain update would overwrite a
  // slug already shown on another tab / share link.
  const claimed = await prisma.walk.updateMany({
    where: { id: walk.id, slug: null },
    data: { slug },
  });
  if (claimed.count === 1) return slug;
  const fresh = await prisma.walk.findUnique({
    where: { id: walk.id },
    select: { slug: true },
  });
  return fresh?.slug ?? slug;
}

/**
 * A share link whose place word is out of date (the walk was renamed after
 * the link went out) still ends in the walk's code. Finds that walk, or
 * null when nothing — or more than one walk — has the code.
 */
export async function findWalkIdBySlugCode(key: string): Promise<string | null> {
  const code = walkSlugCode(key);
  if (!code) return null;
  const matches = await prisma.walk.findMany({
    where: { slug: { endsWith: `-${code}` } },
    select: { id: true },
    take: 2,
  });
  return matches.length === 1 ? matches[0].id : null;
}
