import { customAlphabet } from "nanoid";
import { prisma } from "@/lib/db";
import { appUrl } from "@/lib/urls";

// Same unambiguous alphabet as walk share tokens (src/server/actions/walks.ts),
// just longer — this one grants unauthenticated write access to a member's
// email preferences, so it needs more entropy than a share link does.
export const makeCapabilityToken = customAlphabet("abcdefghjkmnpqrstuvwxyz23456789", 24);

/**
 * Members don't get an unsubscribeToken at signup (see the schema comment on
 * User.unsubscribeToken) — it's created the first time it's actually needed,
 * which is the first email that links to the preferences page.
 */
export async function getOrCreateUserUnsubscribeToken(
  userId: string,
  existing: string | null,
): Promise<string> {
  if (existing) return existing;
  const token = makeCapabilityToken();
  // Only the first concurrent mint wins — a plain update would overwrite
  // another email's just-sent prefs link with a different token.
  const claimed = await prisma.user.updateMany({
    where: { id: userId, unsubscribeToken: null },
    data: { unsubscribeToken: token },
  });
  if (claimed.count === 1) return token;
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { unsubscribeToken: true },
  });
  if (row?.unsubscribeToken) return row.unsubscribeToken;
  // Extremely unlikely: row gone between claim and read. Fall back to our
  // minted token rather than throwing mid-send.
  return token;
}

export function memberPreferencesUrl(token: string): string {
  return `${appUrl()}/email-preferences/${token}`;
}

export function newsletterUnsubscribeUrl(token: string): string {
  return `${appUrl()}/email-preferences/newsletter/${token}`;
}
