import { NextResponse } from "next/server";
import { bearerMatches } from "@/lib/bearer-auth";
import { purgeExpiredStories } from "@/lib/stories";
import { listOldStoryPhotos, removeStoryPhotos, storiesConfigured } from "@/lib/story-storage";
import { prisma } from "@/lib/db";

/**
 * Daily sweep for Stories (Vercel's free plan runs crons once a day; expired
 * stories are also cleared whenever someone opens or posts one):
 * 1. Deletes stories past their 24 hours, and their photos.
 * 2. Deletes any photo older than 25 hours that no story points to (e.g.
 *    its account was removed), so storage never fills with leftovers.
 */
export async function GET(req: Request) {
  if (!bearerMatches(req.headers.get("authorization"), process.env.CRON_SECRET)) {
    return new NextResponse("Unauthorised", { status: 401 });
  }
  if (!storiesConfigured()) return NextResponse.json({ skipped: "not set up" });

  const expired = await purgeExpiredStories();
  const old = await listOldStoryPhotos(new Date(Date.now() - 25 * 60 * 60 * 1000));
  const kept = new Set(
    (await prisma.story.findMany({ where: { path: { in: old } }, select: { path: true } })).map(
      (story) => story.path,
    ),
  );
  const leftovers = old.filter((path) => !kept.has(path));
  await removeStoryPhotos(leftovers);
  return NextResponse.json({ expired, leftovers: leftovers.length });
}
