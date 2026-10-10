import { cacheLife, cacheTag } from "next/cache";
import { displayName } from "@/lib/auth";
import { HOMEPAGE_CACHE_TAG } from "@/lib/homepage-cache";
import { prisma } from "./db";
import { SITE_SETTING_ID } from "./theme";

/** Refreshed whenever who gets contact alerts could have changed (the
 * setting, or that organiser being removed or made a member again). */
export const CONTACT_MESSAGES_OWNER_TAG = "contact-messages-owner";

/**
 * The Messages page's description. A saved copy shared by every server, so
 * the page's loading placeholder can show the real sentence from the first
 * paint, not just the title (a name change catches up within a few minutes).
 */
export async function getContactMessagesDescription(): Promise<{ text: string; hasOwner: boolean }> {
  "use cache: remote";
  cacheTag(CONTACT_MESSAGES_OWNER_TAG, HOMEPAGE_CACHE_TAG);
  cacheLife({ revalidate: 300 });
  const setting = await prisma.siteSetting.findUnique({
    where: { id: SITE_SETTING_ID },
    select: { contactMessagesOwner: { select: { firstName: true, lastName: true, email: true } } },
  });
  const owner = setting?.contactMessagesOwner;
  return owner
    ? {
        hasOwner: true,
        text: `Submissions from the public Contact us form. ${displayName(owner)} gets an email alert for each new one and can reply straight from it — nothing else happens automatically.`,
      }
    : {
        hasOwner: false,
        text: "Submissions from the public Contact us form. No one is set to be alerted by email yet — set that in Settings → Site behaviour → Contact messages.",
      };
}
