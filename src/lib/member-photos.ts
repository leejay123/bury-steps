import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

/** Photos are re-checked this often, in case someone changes theirs and
 * Clerk's webhook didn't reach us. */
const RECHECK_MS = 7 * 24 * 60 * 60 * 1000;
const GOOGLE_PHOTOS_FROM = new Date("2026-10-02T12:00:00Z");

/**
 * A member's own photo, or null for Clerk's default picture. Clerk's
 * `hasImage` is only true for a photo uploaded to Clerk itself, so a photo
 * brought in from signing in with Google counts too: Clerk's image links
 * describe their source, and only the generated default says "default".
 */
export function clerkPhoto(user: { hasImage?: boolean; imageUrl?: string | null } | null | undefined) {
  const url = user?.imageUrl;
  if (!url) return null;
  if (user.hasImage) return url;
  try {
    const encoded = new URL(url).pathname.split("/").pop() ?? "";
    const info = JSON.parse(Buffer.from(encoded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")) as {
      type?: string;
    };
    return info.type && info.type !== "default" ? url : null;
  } catch {
    return null;
  }
}

type PhotoRow = { id: string; clerkId: string; imageUrl: string | null; imageCheckedAt: Date | null };

/**
 * Fills in photos for members on a page of the Members list that were never
 * checked (everyone who joined before photos were stored) or not for a
 * week, in one Clerk request. Returns id → photo for every row. Never
 * throws: if Clerk can't be reached, the saved photos (or initials) show.
 */
export async function withMemberPhotos(rows: PhotoRow[]): Promise<Map<string, string | null>> {
  const photos = new Map(rows.map((row) => [row.id, row.imageUrl]));
  const now = Date.now();
  const stale = rows
    .filter(
      (row) =>
        !row.imageCheckedAt ||
        now - row.imageCheckedAt.getTime() > RECHECK_MS ||
        // Checked before Google sign-in photos counted — look again.
        (row.imageUrl === null && row.imageCheckedAt < GOOGLE_PHOTOS_FROM),
    )
    .slice(0, 100);
  if (stale.length === 0) return photos;

  try {
    const client = await clerkClient();
    const { data } = await client.users.getUserList({ userId: stale.map((row) => row.clerkId), limit: 100 });
    const byClerkId = new Map(data.map((user) => [user.id, clerkPhoto(user)]));
    const checkedAt = new Date();
    await Promise.all(
      stale.map((row) => {
        const imageUrl = byClerkId.get(row.clerkId) ?? null;
        photos.set(row.id, imageUrl);
        return prisma.user.update({ where: { id: row.id }, data: { imageUrl, imageCheckedAt: checkedAt } });
      }),
    );
  } catch (err) {
    console.warn("[member-photos] could not refresh photos from Clerk", err);
  }
  return photos;
}
