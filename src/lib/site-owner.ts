import { prisma } from "./db";
import { SITE_SETTING_ID } from "./theme";

/**
 * The single "master organiser" — the only account that can promote or
 * demote an organiser, edit an organiser's permissions, or remove an
 * organiser's account. Stored as SiteSetting.ownerId, a single pointer to
 * one User row, same pattern as SiteSetting.contactMessagesOwnerId — a
 * single FK can only ever point to one account, so "exactly one owner" is
 * a structural guarantee rather than something enforced by hand.
 *
 * Set automatically the moment the very first organiser is bootstrapped
 * (see syncLocalUser in src/lib/local-user.ts); transferred deliberately
 * after that via transferOwnership in src/server/actions/members.ts. Any
 * organiser holding the Members permission can still view the member list
 * and remove a plain member's account — only the owner-only actions above
 * are gated by this.
 */
export async function getOwnerId(): Promise<string | null> {
  const setting = await prisma.siteSetting.findUnique({
    where: { id: SITE_SETTING_ID },
    select: { ownerId: true },
  });
  return setting?.ownerId ?? null;
}

export async function isOwner(userId: string): Promise<boolean> {
  return (await getOwnerId()) === userId;
}
