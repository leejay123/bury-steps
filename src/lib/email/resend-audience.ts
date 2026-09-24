import { prisma } from "@/lib/db";
import { SITE_SETTING_ID } from "@/lib/theme";
import { getResendClient } from "./client";

/**
 * Keeps newsletter subscribers in sync with a Resend audience (Resend now
 * calls these "Segments" — the SDK's `resend.audiences` is that same
 * Segments API kept under its old name) so an admin can send a real
 * campaign through Resend without hand-exporting a CSV first. Every call
 * here is best-effort: this site's own subscriber lists (NewsletterSubscriber,
 * User.emailNewsletter) are always the source of truth, so a Resend hiccup
 * never blocks someone subscribing/unsubscribing on the site itself.
 */

let cachedAudienceId: string | null | undefined;

/** Clears the in-process audience id cache — call after wiping
 * SiteSetting.resendAudienceId (site reset) so the next sync creates or
 * reloads a fresh audience instead of emailing the pre-wipe segment. */
export function clearAudienceCache(): void {
  cachedAudienceId = undefined;
}

/**
 * Returns the audience id, creating it on first use and persisting it on
 * the single SiteSetting row. Null if Resend isn't configured or the
 * create call fails — callers treat that as "skip the sync", not an error.
 *
 * Always re-reads SiteSetting before trusting any in-process cache: a site
 * reset on another warm serverless instance nulls `resendAudienceId` while
 * this process may still hold the pre-wipe id.
 */
export async function getOrCreateAudienceId(): Promise<string | null> {
  const resend = getResendClient();
  if (!resend) {
    cachedAudienceId = null;
    return null;
  }

  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { id: SITE_SETTING_ID },
      select: { resendAudienceId: true },
    });
    if (setting?.resendAudienceId) {
      cachedAudienceId = setting.resendAudienceId;
      return cachedAudienceId;
    }

    // DB has no audience (fresh install or post-reset). Drop any stale
    // in-process id before creating a replacement segment.
    cachedAudienceId = undefined;

    const { data, error } = await resend.audiences.create({ name: "Newsletter" });
    if (error || !data) {
      console.error("resend-audience: failed to create audience", error);
      cachedAudienceId = null;
      return null;
    }

    await prisma.siteSetting.update({
      where: { id: SITE_SETTING_ID },
      data: { resendAudienceId: data.id },
    });
    cachedAudienceId = data.id;
    return cachedAudienceId;
  } catch (err) {
    console.error("resend-audience: failed to get/create audience", err);
    cachedAudienceId = null;
    return null;
  }
}

/** Adds (or re-adds) a subscriber to the newsletter audience. Best-effort —
 * logs and returns on any failure, including Resend not being configured. */
export async function syncContactSubscribed(email: string, firstName?: string | null): Promise<void> {
  const resend = getResendClient();
  const audienceId = await getOrCreateAudienceId();
  if (!resend || !audienceId) return;

  try {
    const { error } = await resend.contacts.create({
      email,
      unsubscribed: false,
      ...(firstName ? { firstName } : {}),
      segments: [{ id: audienceId }],
    });
    if (error) console.error(`resend-audience: failed to add ${email}`, error);
  } catch (err) {
    console.error(`resend-audience: failed to add ${email}`, err);
  }
}

/** Removes a subscriber from Resend entirely, matching the site's own
 * unsubscribe removing them from future sends. Best-effort. Contacts are
 * looked up by email account-wide, so this still clears orphaned contacts
 * on a pre-reset segment even when SiteSetting.resendAudienceId is null. */
export async function syncContactUnsubscribed(email: string): Promise<void> {
  const resend = getResendClient();
  if (!resend) return;

  try {
    const { error } = await resend.contacts.remove({ email });
    if (error) console.error(`resend-audience: failed to remove ${email}`, error);
  } catch (err) {
    console.error(`resend-audience: failed to remove ${email}`, err);
  }
}
