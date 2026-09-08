import { sendEmail } from "./client";
import { getEmailBrand } from "./brand";
import { resolveEmailCopy } from "./overrides";
import { getOrCreateUserUnsubscribeToken, memberPreferencesUrl, newsletterUnsubscribeUrl } from "./unsubscribe";
import { WelcomeEmail } from "./templates/welcome";
import { AccountDeletedEmail } from "./templates/account-deleted";
import { AdminPromotedEmail } from "./templates/admin-promoted";
import { AdminDemotedEmail } from "./templates/admin-demoted";
import { ContactMessageReceivedEmail } from "./templates/contact-message-received";
import { ContactMessageAdminAlertEmail } from "./templates/contact-message-admin-alert";
import { NewsletterSubscribedEmail } from "./templates/newsletter-subscribed";
import { WalkAnnouncedEmail } from "./templates/walk-announced";
import { WalkCancelledEmail } from "./templates/walk-cancelled";
import { WalkReopenedEmail } from "./templates/walk-reopened";
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

/** "there" reads naturally in a sentence ("Hi there,"); the heading (which
 * has its own "Welcome!"-without-a-name fallback) uses the raw value instead. */
function greetingName(firstName: string | null): string {
  return firstName?.trim() || "there";
}

/** New member has just been created — see src/lib/local-user.ts. */
export async function sendWelcomeEmail(member: MemberLike): Promise<void> {
  const [brand, preferencesUrl] = await Promise.all([getEmailBrand(), memberPreferences(member)]);
  const copy = await resolveEmailCopy("welcome", {
    firstName: greetingName(member.firstName),
    siteName: brand.siteName,
    siteUrl: brand.siteUrl,
  });
  await sendEmail({
    to: member.email,
    subject: copy.subject,
    react: WelcomeEmail({
      ...brand,
      firstName: member.firstName,
      preferencesUrl,
      bodyParagraphs: copy.bodyParagraphs,
    }),
  });
}

/** Account (self- or admin-) deleted — see src/server/actions/members.ts. */
export async function sendAccountDeletedEmail(member: {
  email: string;
  firstName: string | null;
}): Promise<void> {
  const brand = await getEmailBrand();
  const copy = await resolveEmailCopy("accountDeleted", {
    firstName: greetingName(member.firstName),
    siteName: brand.siteName,
  });
  await sendEmail({
    to: member.email,
    subject: copy.subject,
    react: AccountDeletedEmail({ ...brand, bodyParagraphs: copy.bodyParagraphs }),
  });
}

/** Promoted MEMBER -> ADMIN — see setMemberRole in src/server/actions/members.ts. */
export async function sendAdminPromotedEmail(member: MemberLike): Promise<void> {
  const [brand, preferencesUrl] = await Promise.all([getEmailBrand(), memberPreferences(member)]);
  const copy = await resolveEmailCopy("adminPromoted", {
    firstName: greetingName(member.firstName),
    siteName: brand.siteName,
    siteUrl: brand.siteUrl,
  });
  await sendEmail({
    to: member.email,
    subject: copy.subject,
    react: AdminPromotedEmail({ ...brand, preferencesUrl, bodyParagraphs: copy.bodyParagraphs }),
  });
}

/** Demoted ADMIN -> MEMBER — see setMemberRole in src/server/actions/members.ts. */
export async function sendAdminDemotedEmail(member: MemberLike): Promise<void> {
  const [brand, preferencesUrl] = await Promise.all([getEmailBrand(), memberPreferences(member)]);
  const copy = await resolveEmailCopy("adminDemoted", {
    firstName: greetingName(member.firstName),
    siteName: brand.siteName,
    siteUrl: brand.siteUrl,
  });
  await sendEmail({
    to: member.email,
    subject: copy.subject,
    react: AdminDemotedEmail({ ...brand, preferencesUrl, bodyParagraphs: copy.bodyParagraphs }),
  });
}

/** Auto-reply to whoever submitted the public contact form. */
export async function sendContactMessageReceivedEmail(submission: {
  name: string;
  email: string;
  message: string;
}): Promise<void> {
  const brand = await getEmailBrand();
  const copy = await resolveEmailCopy("contactReceived", {
    name: submission.name,
    email: submission.email,
    message: submission.message,
    siteName: brand.siteName,
  });
  await sendEmail({
    to: submission.email,
    subject: copy.subject,
    react: ContactMessageReceivedEmail({
      ...brand,
      message: submission.message,
      bodyParagraphs: copy.bodyParagraphs,
    }),
  });
}

/** Alert every organiser that a new contact form message has arrived. */
export async function sendContactMessageAdminAlertEmail(
  submission: { name: string; email: string; phone: string | null; message: string },
  adminEmails: string[],
): Promise<void> {
  if (adminEmails.length === 0) return;
  const brand = await getEmailBrand();
  const copy = await resolveEmailCopy("contactAdminAlert", {
    name: submission.name,
    email: submission.email,
    message: submission.message,
    siteName: brand.siteName,
  });
  await sendEmail({
    to: adminEmails,
    subject: copy.subject,
    react: ContactMessageAdminAlertEmail({ ...brand, ...submission, bodyParagraphs: copy.bodyParagraphs }),
    replyTo: submission.email,
  });
}

/** Confirmation for a footer newsletter signup (src/server/actions/newsletter.ts). */
export async function sendNewsletterSubscribedEmail(subscriber: {
  email: string;
  unsubscribeToken: string;
}): Promise<void> {
  const brand = await getEmailBrand();
  const copy = await resolveEmailCopy("newsletterSubscribed", { siteName: brand.siteName });
  await sendEmail({
    to: subscriber.email,
    subject: copy.subject,
    react: NewsletterSubscribedEmail({
      ...brand,
      unsubscribeUrl: newsletterUnsubscribeUrl(subscriber.unsubscribeToken),
      bodyParagraphs: copy.bodyParagraphs,
    }),
    // A retried subscribeToNewsletter call (network hiccup, double form
    // submit) reuses this key instead of sending a second confirmation.
    idempotencyKey: `newsletter-subscribed/${subscriber.email}`,
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
  const copy = await resolveEmailCopy("walkAnnounced", {
    firstName: greetingName(member.firstName),
    siteName: brand.siteName,
    walkTitle: walk.title,
    whenText: walk.whenText,
    durationText: walk.durationText,
    meetingPoint: walk.meetingPoint ?? "",
  });
  await sendEmail({
    to: member.email,
    subject: copy.subject,
    react: WalkAnnouncedEmail({
      ...brand,
      title: walk.title,
      whenText: walk.whenText,
      durationText: walk.durationText,
      meetingPoint: walk.meetingPoint,
      what3words: walk.what3words,
      shareUrl: walk.shareUrl,
      preferencesUrl,
      bodyParagraphs: copy.bodyParagraphs,
    }),
  });
}

/** Walk cancelled — same one-per-member rule as sendWalkAnnouncedEmail. */
export async function sendWalkCancelledEmail(
  walk: WalkLike & { reason: string | null },
  member: MemberLike,
): Promise<void> {
  const [brand, preferencesUrl] = await Promise.all([getEmailBrand(), memberPreferences(member)]);
  const copy = await resolveEmailCopy("walkCancelled", {
    firstName: greetingName(member.firstName),
    siteName: brand.siteName,
    walkTitle: walk.title,
    whenText: walk.whenText,
    reason: walk.reason ?? "",
  });
  await sendEmail({
    to: member.email,
    subject: copy.subject,
    react: WalkCancelledEmail({
      ...brand,
      title: walk.title,
      whenText: walk.whenText,
      reason: walk.reason,
      shareUrl: walk.shareUrl,
      preferencesUrl,
      bodyParagraphs: copy.bodyParagraphs,
    }),
  });
}

/** A cancelled walk was reopened — same one-per-member rule as sendWalkAnnouncedEmail. */
export async function sendWalkReopenedEmail(
  walk: WalkLike & { durationText: string; meetingPoint: string | null; what3words: string | null },
  member: MemberLike,
): Promise<void> {
  const [brand, preferencesUrl] = await Promise.all([getEmailBrand(), memberPreferences(member)]);
  const copy = await resolveEmailCopy("walkReopened", {
    firstName: greetingName(member.firstName),
    siteName: brand.siteName,
    walkTitle: walk.title,
    whenText: walk.whenText,
    durationText: walk.durationText,
    meetingPoint: walk.meetingPoint ?? "",
  });
  await sendEmail({
    to: member.email,
    subject: copy.subject,
    react: WalkReopenedEmail({
      ...brand,
      title: walk.title,
      whenText: walk.whenText,
      durationText: walk.durationText,
      meetingPoint: walk.meetingPoint,
      what3words: walk.what3words,
      shareUrl: walk.shareUrl,
      preferencesUrl,
      bodyParagraphs: copy.bodyParagraphs,
    }),
  });
}

/** An organiser manually added this member to a walk (src/server/actions/attendance.ts). */
export async function sendAddedToWalkEmail(
  walk: WalkLike & { meetingPoint: string | null },
  member: MemberLike,
): Promise<void> {
  const [brand, preferencesUrl] = await Promise.all([getEmailBrand(), memberPreferences(member)]);
  const copy = await resolveEmailCopy("addedToWalk", {
    firstName: greetingName(member.firstName),
    siteName: brand.siteName,
    walkTitle: walk.title,
    whenText: walk.whenText,
    meetingPoint: walk.meetingPoint ?? "",
  });
  await sendEmail({
    to: member.email,
    subject: copy.subject,
    react: AddedToWalkEmail({
      ...brand,
      title: walk.title,
      whenText: walk.whenText,
      meetingPoint: walk.meetingPoint,
      shareUrl: walk.shareUrl,
      preferencesUrl,
      bodyParagraphs: copy.bodyParagraphs,
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
  const copy = await resolveEmailCopy("accidentReportAlert", {
    whenText: report.whenText,
    walkTitle: report.walkTitle ?? "",
    whoInvolved: report.whoInvolved,
    createdByName: report.createdByName,
    siteName: brand.siteName,
  });
  await sendEmail({
    to: adminEmails,
    subject: copy.subject,
    react: AccidentReportAlertEmail({ ...brand, ...report, bodyParagraphs: copy.bodyParagraphs }),
  });
}
