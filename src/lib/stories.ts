import { prisma } from "@/lib/db";
import { removeStoryPhotos } from "@/lib/story-storage";

/** A story shows for 24 hours from when it's posted. */
export const STORY_HOURS = 24;
/** How many live stories one person can have at once. */
export const MAX_LIVE_STORIES = 10;

export function storyExpiry(from = new Date()): Date {
  return new Date(from.getTime() + STORY_HOURS * 60 * 60 * 1000);
}

/**
 * Removes stories past their 24 hours: the rows, and their photos from
 * storage (the space comes back). Run whenever stories are opened or posted,
 * and by the daily sweep.
 */
export async function purgeExpiredStories(now = new Date()): Promise<number> {
  const expired = await prisma.story.findMany({
    where: { expiresAt: { lte: now } },
    select: { id: true, path: true },
    take: 500,
  });
  if (expired.length === 0) return 0;
  await removeStoryPhotos(expired.map((story) => story.path));
  await prisma.story.deleteMany({ where: { id: { in: expired.map((story) => story.id) } } });
  return expired.length;
}
