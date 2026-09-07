import { sendEmail } from "./client";
import { getEmailBrand } from "./brand";
import { getOrCreateUserUnsubscribeToken, memberPreferencesUrl, newsletterUnsubscribeUrl } from "./unsubscribe";
import { WelcomeEmail } from "./templates/welcome";
import { AccountDeletedEmail } from "./templates/account-deleted";
import { AdminPromotedEmail } from "./templates/admin-promoted";
import { ContactMessageReceivedEmail } from "./templates/contact-message-received";
import { ContactMessageAdminAlertEmail } from "./templates/contact-message-admin-alert";
import { NewsletterSubscribedEmail } from "./templates/newsletter-subscribed";

type MemberLike = {
  id: string;
  email: string;
  firstName: string | null;
  unsubscribeToken: string | null;
};

async function memberPreferences(member: MemberLike): Promise<string> {
  const token = await getOrCreateUserUnsubscribeToken(member.id, member.unsubscribeToken);
  return memberPreferencesUrl(token);
}

/** New member has just been created — see src/lib/local-user.ts. */
export async function sendWelcomeEmail(member: MemberLike): Promise<void> {
  const [brand, preferencesUrl] = await Promise.all([getEmailBrand(), memberPreferences(member)]);
  await sendEmail({
    to: member.email,
    subject: `Welcome to ${brand.siteName}`,
    react: WelcomeEmail({ ...brand, firstName: member.firstName, preferencesUrl }),
  });
}

/** Account (self- or admin-) deleted — see src/server/actions/members.ts. */
export async function sendAccountDeletedEmail(member: {
  email: string;
  firstName: string | null;
}): Promise<void> {
  const brand = await getEmailBrand();
  await sendEmail({
    to: member.email,
    subject: `Your ${brand.siteName} account has been deleted`,
    react: AccountDeletedEmail({ ...brand, firstName: member.firstName }),
  });
}

/** Promoted MEMBER -> ADMIN — see setMemberRole in src/server/actions/members.ts. */
export async function sendAdminPromotedEmail(member: MemberLike): Promise<void> {
  const [brand, preferencesUrl] = await Promise.all([getEmailBrand(), memberPreferences(member)]);
  await sendEmail({
    to: member.email,
    subject: `You're now an organiser of ${brand.siteName}`,
    react: AdminPromotedEmail({ ...brand, firstName: member.firstName, preferencesUrl }),
  });
}

/** Auto-reply to whoever submitted the public contact form. */
export async function sendContactMessageReceivedEmail(submission: {
  name: string;
  email: string;
  message: string;
}): Promise<void> {
  const brand = await getEmailBrand();
  await sendEmail({
    to: submission.email,
    subject: `We've got your message — ${brand.siteName}`,
    react: ContactMessageReceivedEmail({ ...brand, name: submission.name, message: submission.message }),
  });
}

/** Alert every organiser that a new contact form message has arrived. */
export async function sendContactMessageAdminAlertEmail(
  submission: { name: string; email: string; phone: string | null; message: string },
  adminEmails: string[],
): Promise<void> {
  if (adminEmails.length === 0) return;
  const brand = await getEmailBrand();
  await sendEmail({
    to: adminEmails,
    subject: `New contact form message from ${submission.name}`,
    react: ContactMessageAdminAlertEmail({ ...brand, ...submission }),
    replyTo: submission.email,
  });
}

/** Confirmation for a footer newsletter signup (src/server/actions/newsletter.ts). */
export async function sendNewsletterSubscribedEmail(subscriber: {
  email: string;
  unsubscribeToken: string;
}): Promise<void> {
  const brand = await getEmailBrand();
  await sendEmail({
    to: subscriber.email,
    subject: `You're subscribed — ${brand.siteName}`,
    react: NewsletterSubscribedEmail({
      ...brand,
      unsubscribeUrl: newsletterUnsubscribeUrl(subscriber.unsubscribeToken),
    }),
  });
}
