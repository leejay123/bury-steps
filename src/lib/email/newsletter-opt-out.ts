import { prisma } from "@/lib/db";
import { syncContactSubscribed, syncContactUnsubscribed } from "@/lib/email/resend-audience";

function emailMatch(normalised: string) {
  // Case-insensitive match — Clerk may store mixed-case emails while the
  // footer form lowercases on the way in (same pattern as the Resend webhook).
  return { equals: normalised, mode: "insensitive" as const };
}

/**
 * Newsletter opt-out is one preference across two stores (footer
 * NewsletterSubscriber + User.emailNewsletter). Clearing only one leaves
 * the other to re-opt them in on the next campaign sync.
 */
export async function optOutNewsletterEverywhere(email: string): Promise<void> {
  const normalised = email.trim().toLowerCase();
  if (!normalised) return;
  const match = emailMatch(normalised);
  await Promise.all([
    prisma.newsletterSubscriber.updateMany({
      where: { email: match, unsubscribedAt: null },
      data: { unsubscribedAt: new Date() },
    }),
    prisma.user.updateMany({
      where: { email: match, emailNewsletter: true },
      data: { emailNewsletter: false },
    }),
  ]);
  await syncContactUnsubscribed(normalised);
}

/**
 * Mirror of {@link optOutNewsletterEverywhere} for authenticated preference
 * flows that intentionally turn the member newsletter toggle on. Clears a
 * footer unsubscribe, sets matching `User.emailNewsletter = true`, and
 * re-adds them to Resend. Public footer signup must NOT call this — it would
 * let anyone force-write a member preference by email alone.
 */
export async function optInNewsletterEverywhere(
  email: string,
  firstName?: string | null,
): Promise<void> {
  const normalised = email.trim().toLowerCase();
  if (!normalised) return;
  const match = emailMatch(normalised);
  await Promise.all([
    prisma.newsletterSubscriber.updateMany({
      where: { email: match, unsubscribedAt: { not: null } },
      data: { unsubscribedAt: null },
    }),
    prisma.user.updateMany({
      where: { email: match, emailNewsletter: false },
      data: { emailNewsletter: true },
    }),
  ]);
  await syncContactSubscribed(normalised, firstName);
}

/**
 * Align Resend (and, on opt-in, a prior footer unsubscribe) with an
 * already-saved `User.emailNewsletter` value. Re-reads the user row so a
 * concurrent preferences save cannot leave Resend subscribed after the DB
 * ends opted out. Does not flip `User.emailNewsletter`.
 *
 * When the member toggle is off, an active footer signup must stay active
 * until a true→false prefs save (or unsubscribe link) opts out everywhere —
 * wiping the footer on every prefs save (newsletter often left unchecked
 * while default-off) would undo a footer subscribe. Prefer
 * {@link alignNewsletterPrefWithActiveFooter} on prefs load so the toggle
 * matches legacy footer-only signups. Resend stays subscribed iff an active
 * footer row remains while the toggle is off.
 */
export async function syncNewsletterAudienceToPreference(
  email: string,
  firstName?: string | null,
): Promise<void> {
  const normalised = email.trim().toLowerCase();
  if (!normalised) return;
  const match = emailMatch(normalised);
  const user = await prisma.user.findFirst({
    where: { email: match },
    select: { emailNewsletter: true },
  });
  if (!user) return;

  if (!user.emailNewsletter) {
    const activeFooter = await prisma.newsletterSubscriber.findFirst({
      where: { email: match, unsubscribedAt: null },
      select: { id: true },
    });
    if (activeFooter) {
      await syncContactSubscribed(normalised, firstName);
      return;
    }
    await syncContactUnsubscribed(normalised);
    return;
  }

  await prisma.newsletterSubscriber.updateMany({
    where: { email: match, unsubscribedAt: { not: null } },
    data: { unsubscribedAt: null },
  });
  // Re-check immediately before Resend so a concurrent opt-out wins.
  const stillWanted = await prisma.user.findFirst({
    where: { email: match, emailNewsletter: true },
    select: { id: true },
  });
  if (!stillWanted) {
    await syncContactUnsubscribed(normalised);
    return;
  }
  await syncContactSubscribed(normalised, firstName);
}

/**
 * Legacy / dual-store repair: if this member has an active footer newsletter
 * row but `User.emailNewsletter` is still false (signed up before footer
 * subscribe flipped the toggle), turn the prefs flag on so Email preferences
 * shows Newsletter checked and a later uncheck can opt out everywhere.
 * Returns the effective newsletter preference after alignment.
 */
export async function alignNewsletterPrefWithActiveFooter(
  userId: string,
  email: string,
): Promise<boolean> {
  const normalised = email.trim().toLowerCase();
  if (!userId || !normalised) return false;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailNewsletter: true },
  });
  if (!user) return false;
  if (user.emailNewsletter) return true;

  const match = emailMatch(normalised);
  const activeFooter = await prisma.newsletterSubscriber.findFirst({
    where: { email: match, unsubscribedAt: null },
    select: { id: true },
  });
  if (!activeFooter) return false;
  await prisma.user.updateMany({
    where: { id: userId, emailNewsletter: false },
    data: { emailNewsletter: true },
  });
  return true;
}
