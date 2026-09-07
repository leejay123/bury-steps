import { sendEmail } from "./client";
import { getEmailBrand } from "./brand";
import { getOrCreateUserUnsubscribeToken, memberPreferencesUrl, newsletterUnsubscribeUrl } from "./unsubscribe";
import { WelcomeEmail } from "./templates/welcome";
import { AccountDeletedEmail } from "./templates/account-deleted";
import { AdminPromotedEmail } from "./templates/admin-promoted";
import { ContactMessageReceivedEmail } from "./templates/contact-message-received";
import { ContactMessageAdminAlertEmail } from "./templates/contact-message-admin-alert";
import { NewsletterSubscribedEmail } from "./templates/newsletter-subscribed";
import { WalkAnnouncedEmail } from "./templates/walk-announced";
import { WalkCancelledEmail } from "./templates/walk-cancelled";
import { AddedToWalkEmail } from "./templates/added-to-walk";
import { AccidentReportAlertEmail } from "./templates/accident-report-alert";

export type MemberLike = {
  id: string;
  email: string;
  firstName: string | null;
  unsubscribeToken: string | null;
};

/** The bits of a Walk every walk-related email needs — callers pass in
 * already-formatted date/time strings rather than this module reaching for
 * the site's date-formatting helpers itself. */
export type WalkLike = {
  title: string;
  whenText: string;
  shareUrl: string;
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

/**
 * New walk posted — one call per opted-in member (src/server/actions/walks.ts
 * loops over the recipient list). Never batch these into one `to:` array:
 * that would put every member's address in every other member's inbox.
 */
export async function sendWalkAnnouncedEmail(
  walk: WalkLike & { durationText: string; meetingPoint: string | null; what3words: string | null },
  member: MemberLike,
): Promise<void> {
  const [brand, preferencesUrl] = await Promise.all([getEmailBrand(), memberPreferences(member)]);
  await sendEmail({
    to: member.email,
    subject: `New walk: ${walk.title}`,
    react: WalkAnnouncedEmail({
      ...brand,
      firstName: member.firstName,
      title: walk.title,
      whenText: walk.whenText,
      durationText: walk.durationText,
      meetingPoint: walk.meetingPoint,
      what3words: walk.what3words,
      shareUrl: walk.shareUrl,
      preferencesUrl,
    }),
  });
}

/** Walk cancelled — same one-per-member rule as sendWalkAnnouncedEmail. */
export async function sendWalkCancelledEmail(
  walk: WalkLike & { reason: string | null },
  member: MemberLike,
): Promise<void> {
  const [brand, preferencesUrl] = await Promise.all([getEmailBrand(), memberPreferences(member)]);
  await sendEmail({
    to: member.email,
    subject: `Walk cancelled: ${walk.title}`,
    react: WalkCancelledEmail({
      ...brand,
      firstName: member.firstName,
      title: walk.title,
      whenText: walk.whenText,
      reason: walk.reason,
      shareUrl: walk.shareUrl,
      preferencesUrl,
    }),
  });
}

/** An organiser manually added this member to a walk (src/server/actions/attendance.ts). */
export async function sendAddedToWalkEmail(
  walk: WalkLike & { meetingPoint: string | null },
  member: MemberLike,
): Promise<void> {
  const [brand, preferencesUrl] = await Promise.all([getEmailBrand(), memberPreferences(member)]);
  await sendEmail({
    to: member.email,
    subject: `You've been added to ${walk.title}`,
    react: AddedToWalkEmail({
      ...brand,
      firstName: member.firstName,
      title: walk.title,
      whenText: walk.whenText,
      meetingPoint: walk.meetingPoint,
      shareUrl: walk.shareUrl,
      preferencesUrl,
    }),
  });
}

/** Alert every other organiser that a new accident report has been logged. */
export async function sendAccidentReportAlertEmail(
  report: { whenText: string; walkTitle: string | null; whoInvolved: string; createdByName: string },
  adminEmails: string[],
): Promise<void> {
  if (adminEmails.length === 0) return;
  const brand = await getEmailBrand();
  await sendEmail({
    to: adminEmails,
    subject: "New accident report logged",
    react: AccidentReportAlertEmail({ ...brand, ...report }),
  });
}
