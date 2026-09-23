import { prisma } from "./db";

/**
 * The owner set — any number of accounts (at least one; removeOwner in
 * src/server/actions/members.ts refuses to strip the last one) can hold
 * full "master organiser" access: promote or demote an organiser, edit an
 * organiser's permissions, remove an organiser's account, and grant or
 * revoke another account's owner access. Stored directly on User.isOwner —
 * previously a single SiteSetting.ownerId pointer, back when there could
 * only ever be one.
 *
 * Set automatically the moment the very first organiser is bootstrapped
 * (see syncLocalUser in src/lib/local-user.ts); changed after that via
 * addOwner/removeOwner/transferOwnership in src/server/actions/members.ts.
 * Any organiser holding the Members permission can still view the member
 * list and remove a plain member's account — only the owner-only actions
 * above are gated by this.
 */
export async function isOwner(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isOwner: true } });
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
