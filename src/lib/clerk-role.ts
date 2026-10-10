import { auth, clerkClient } from "@clerk/nextjs/server";
import { after } from "next/server";
import { prisma } from "@/lib/db";

export type ClerkRole = "ADMIN" | "MEMBER";

/** What Clerk keeps about someone's access: organiser or member, and owner or not. */
export type ClerkRoleInfo = { role: ClerkRole; owner: boolean };

/** Clerk's copy of it, read from their sign-in token. */
export type RoleClaims = { metadata?: { role?: ClerkRole; owner?: boolean } };

/**
 * Copies a person's access (organiser or member, owner or not) into Clerk,
 * where it rides along in their sign-in token (Clerk dashboard → Sessions →
 * Customize session token: "metadata": "{{user.public_metadata}}").
 * proxy.ts reads it there to turn people away from organiser pages they
 * can't use before anything is drawn, without a database lookup. Their
 * token picks it up within about a minute. Never throws: the database stays
 * the real record, and every organiser page still checks it.
 * See https://clerk.com/docs/guides/secure/basic-rbac.
 */
export async function setClerkRole(clerkId: string, info: ClerkRoleInfo): Promise<void> {
  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(clerkId, { publicMetadata: { role: info.role, owner: info.owner } });
  } catch (err) {
    console.warn("[clerk-role] could not update access in Clerk", err);
  }
}

/** After a role or ownership change: copies these people's access, as saved, into Clerk. */
export async function syncClerkRoleFor(userIds: string[]): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { clerkId: true, role: true, isOwner: true },
    });
    await Promise.all(users.map((user) => setClerkRole(user.clerkId, { role: user.role, owner: user.isOwner })));
  } catch (err) {
    // The change itself is saved; the token catches up on their next page view.
    console.warn("[clerk-role] could not copy access to Clerk after a change", err);
  }
}

// Each server remembers who it already updated recently, so the minute
// before someone's token refreshes doesn't call Clerk on every page.
const recentlySynced = new Map<string, number>();
const RESYNC_AFTER_MS = 10 * 60 * 1000;

/**
 * When the signed-in person's token doesn't carry their current access
 * (they signed in before it was copied, or it changed), updates Clerk after
 * the page has been sent, so nobody waits for it.
 */
export async function syncOwnClerkRole(user: { clerkId: string; role: ClerkRole; isOwner: boolean }): Promise<void> {
  try {
    const { sessionClaims } = await auth();
    const claims = (sessionClaims as RoleClaims | null)?.metadata;
    if (claims?.role === user.role && claims?.owner === user.isOwner) return;
    const last = recentlySynced.get(user.clerkId);
    if (last && Date.now() - last < RESYNC_AFTER_MS) return;
    recentlySynced.set(user.clerkId, Date.now());
    after(() => setClerkRole(user.clerkId, { role: user.role, owner: user.isOwner }));
  } catch {
    // Not inside a request (build): nothing to sync.
  }
}
