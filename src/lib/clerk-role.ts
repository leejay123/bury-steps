import { auth, clerkClient } from "@clerk/nextjs/server";
import { after } from "next/server";

export type ClerkRole = "ADMIN" | "MEMBER";

/** Clerk's copy of a person's role, read from their sign-in token. */
export type RoleClaims = { metadata?: { role?: ClerkRole } };

/**
 * Copies a person's role (organiser or member) into Clerk, where it rides
 * along in their sign-in token (Clerk dashboard → Sessions → Customize
 * session token: "metadata": "{{user.public_metadata}}"). proxy.ts reads it
 * there to turn non-organisers away from organiser pages before anything is
 * drawn, without a database lookup. Their token picks it up within about a
 * minute. Never throws: the database stays the real record, and the
 * organiser pages still check it. See https://clerk.com/docs/guides/secure/basic-rbac.
 */
export async function setClerkRole(clerkId: string, role: ClerkRole): Promise<void> {
  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(clerkId, { publicMetadata: { role } });
  } catch (err) {
    console.warn("[clerk-role] could not update the role in Clerk", err);
  }
}

// Each server remembers who it already updated recently, so the minute
// before someone's token refreshes doesn't call Clerk on every page.
const recentlySynced = new Map<string, number>();
const RESYNC_AFTER_MS = 10 * 60 * 1000;

/**
 * When the signed-in person's token doesn't carry their current role (they
 * signed up before roles were copied, or their role changed), updates
 * Clerk after the page has been sent, so nobody waits for it.
 */
export async function syncOwnClerkRole(user: { clerkId: string; role: ClerkRole }): Promise<void> {
  try {
    const { sessionClaims } = await auth();
    if ((sessionClaims as RoleClaims | null)?.metadata?.role === user.role) return;
    const last = recentlySynced.get(user.clerkId);
    if (last && Date.now() - last < RESYNC_AFTER_MS) return;
    recentlySynced.set(user.clerkId, Date.now());
    after(() => setClerkRole(user.clerkId, user.role));
  } catch {
    // Not inside a request (build): nothing to sync.
  }
}
