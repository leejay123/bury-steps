import { customAlphabet } from "nanoid";
import { prisma } from "@/lib/db";
import { appUrl } from "@/lib/urls";

// Same unambiguous alphabet as walk share tokens (src/server/actions/walks.ts),
// just longer — this one grants unauthenticated write access to a member's
// email preferences, so it needs more entropy than a share link does.
const makeToken = customAlphabet("abcdefghjkmnpqrstuvwxyz23456789", 24);

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
  const token = makeToken();
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { unsubscribeToken: token },
    select: { unsubscribeToken: true },
  });
  // Non-null: we just set it in this same call.
  return updated.unsubscribeToken as string;
}

export function memberPreferencesUrl(token: string): string {
  return `${appUrl()}/email-preferences/${token}`;
}

export function newsletterUnsubscribeUrl(token: string): string {
  return `${appUrl()}/email-preferences/newsletter/${token}`;
}
