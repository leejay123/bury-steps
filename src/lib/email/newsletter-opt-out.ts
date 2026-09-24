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
  await Promise.all([
    prisma.newsletterSubscriber.updateMany({
      where: { email: normalised, unsubscribedAt: null },
      data: { unsubscribedAt: new Date() },
    }),
    prisma.user.updateMany({
      where: { email: normalised, emailNewsletter: true },
      data: { emailNewsletter: false },
    }),
  ]);
  await syncContactUnsubscribed(normalised);
}
