"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { guardArgs, guardForm } from "@/lib/safe-action";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { MAX_LIVE_STORIES, purgeExpiredStories, storyExpiry } from "@/lib/stories";
import { removeStoryPhotos, storiesConfigured, uploadStoryPhoto } from "@/lib/story-storage";
import type { ActionResult } from "./shared";

/** Photos arrive already shrunk on the phone; this is only a safety limit. */
const MAX_UPLOAD_BYTES = 1_500_000;
const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/png": "png",
};

/** Post a photo story: anyone signed in, up to 10 live at once, gone after 24 hours. */
export const postStory = guardForm(
  "member",
  z.object({}),
  () => ({}),
  async (_prev, formData): Promise<ActionResult> => {
    const user = await requireUser();
    if (!storiesConfigured()) return { ok: false, error: "Stories aren't set up yet." };
    const photo = formData.get("photo");
    if (!(photo instanceof Blob) || photo.size === 0)
      return { ok: false, error: "Choose a photo first." };
    const ext = PHOTO_TYPES[photo.type];
    if (!ext) return { ok: false, error: "That isn't a photo we can use. Try a JPEG or PNG." };
    if (photo.size > MAX_UPLOAD_BYTES)
      return { ok: false, error: "That photo is too big. Try another one." };

    await purgeExpiredStories();
    const live = await prisma.story.count({
      where: { userId: user.id, expiresAt: { gt: new Date() } },
    });
    if (live >= MAX_LIVE_STORIES)
      return {
        ok: false,
        error: `You can have ${MAX_LIVE_STORIES} stories at once. One goes after 24 hours, or delete one.`,
      };

    const path = `${user.id}/${randomUUID()}.${ext}`;
    await uploadStoryPhoto(path, photo, photo.type);
    try {
      await prisma.story.create({ data: { userId: user.id, path, expiresAt: storyExpiry() } });
    } catch (err) {
      await removeStoryPhotos([path]);
      throw err;
    }
    return { ok: true, message: "Added to your story. It shows for 24 hours." };
  },
);

/** Delete a story: your own, or anyone's if you're an organiser. */
export const deleteStory = guardArgs(
  "member",
  z.object({ id: z.string().min(1) }),
  async ({ id }): Promise<ActionResult> => {
    const user = await requireUser();
    const story = await prisma.story.findUnique({ where: { id }, select: { userId: true, path: true } });
    if (!story) return { ok: true, message: "Story deleted." };
    if (story.userId !== user.id && user.role !== "ADMIN")
      return { ok: false, error: "You can only delete your own stories." };
    await prisma.story.delete({ where: { id } });
    await removeStoryPhotos([story.path]);
    return { ok: true, message: "Story deleted." };
  },
);

/** Report someone else's story: organisers see it flagged, and can remove it. */
export const reportStory = guardArgs(
  "member",
  z.object({ id: z.string().min(1) }),
  async ({ id }): Promise<ActionResult> => {
    const user = await requireUser();
    const story = await prisma.story.findUnique({ where: { id }, select: { userId: true } });
    if (!story) return { ok: false, error: "That story has gone." };
    if (story.userId === user.id) return { ok: false, error: "You can't report your own story." };
    await prisma.storyReport.upsert({
      where: { storyId_userId: { storyId: id, userId: user.id } },
      create: { storyId: id, userId: user.id },
      update: {},
    });
    return { ok: true, message: "Thanks — the organisers will take a look." };
  },
);
