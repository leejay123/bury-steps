import { prisma } from "@/lib/db";
import { syncContactUnsubscribed } from "@/lib/email/resend-audience";

/**
 * Newsletter opt-out is one preference across two stores (footer
 * NewsletterSubscriber + User.emailNewsletter). Clearing only one leaves
 * the other to re-opt them in on the next campaign sync.
 */
export async function optOutNewsletterEverywhere(email: string): Promise<void> {
  const normalised = email.trim().toLowerCase();
  if (!normalised) return;
  // Case-insensitive match — Clerk may store mixed-case emails while the
  // footer form lowercases on the way in (same pattern as the Resend webhook).
  const emailMatch = { equals: normalised, mode: "insensitive" as const };
  await Promise.all([
    prisma.newsletterSubscriber.updateMany({
      where: { email: emailMatch, unsubscribedAt: null },
      data: { unsubscribedAt: new Date() },
    }),
    prisma.user.updateMany({
      where: { email: emailMatch, emailNewsletter: true },
      data: { emailNewsletter: false },
    }),
  ]);
  await syncContactUnsubscribed(normalised);
}
