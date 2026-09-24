import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "./db";

/**
 * The owner set — any number of accounts (at least one; removeOwner in
 * src/server/actions/members.ts refuses to strip the last one) can hold
 * full "master organiser" access: promote or demote an organiser, remove
 * an account, grant or revoke another account's owner access, and
 * everything else in FULL_ORGANISER_PERMISSIONS (Members, Messages,
 * Settings, health notes on walks, …). Stored directly on User.isOwner —
 * previously a single SiteSetting.ownerId pointer, back when there could
 * only ever be one.
 *
 * Plain organisers get a fixed narrower profile (walks + accident reports
 * only — see ORGANISER_PERMISSIONS); those capabilities are not edited per
 * person. Set automatically the moment the very first organiser is
 * bootstrapped (see syncLocalUser in src/lib/local-user.ts); changed after
 * that via addOwner/removeOwner/transferOwnership in
 * src/server/actions/members.ts.
 *
 * Cached per request so nav + requireAdmin + page checks share one lookup
 * when they only have a user id (prefer `user.isOwner` when the row is
 * already loaded).
 */
export const isOwner = cache(async (userId: string): Promise<boolean> => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isOwner: true } });
  return user?.isOwner ?? false;
});

/**
 * Fresh DB read of `User.isOwner` — bypasses the React-cached {@link isOwner}
 * so a concurrent removeOwner of the actor cannot slip past an earlier gate
 * inside the same request or after the optimistic check.
 */
export async function actorStillOwner(
  userId: string,
  db: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<boolean> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { isOwner: true } });
  return user?.isOwner ?? false;
}

/** Every current owner's id — used where a page needs to mark more than
 * one row as "Owner" at once (the members list, a member's own page)
 * without an isOwner() round trip per row. */
export async function getOwnerIds(): Promise<string[]> {
  const owners = await prisma.user.findMany({ where: { isOwner: true }, select: { id: true } });
  return owners.map((owner) => owner.id);
}

/** How many owners the group currently has — removeOwner's "keep at least
 * one" guard, kept as its own query rather than getOwnerIds().length so
 * that check never has to pull every owner's id just to count them. */
export async function ownerCount(): Promise<number> {
  return prisma.user.count({ where: { isOwner: true } });
}
