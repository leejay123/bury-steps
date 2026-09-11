import { sendEmail, type SendEmailInput } from "./client";
import { getEmailBrand } from "./brand";
import { resolveEmailCopy } from "./overrides";
import { getOrCreateUserUnsubscribeToken, memberPreferencesUrl, newsletterUnsubscribeUrl } from "./unsubscribe";
import { WelcomeEmail } from "./templates/welcome";
import { AccountDeletedEmail } from "./templates/account-deleted";
import { AdminPromotedEmail } from "./templates/admin-promoted";
import { AdminDemotedEmail } from "./templates/admin-demoted";
import { OrganiserInviteEmail } from "./templates/organiser-invite";
import { ORGANISER_INVITE_EXPIRY_DAYS } from "@/lib/organiser-invite";
import { describeOrganiserPermissions, type OrganiserPermissions } from "@/lib/organiser-permissions";
import { ContactMessageReceivedEmail } from "./templates/contact-message-received";
import { ContactMessageAdminAlertEmail } from "./templates/contact-message-admin-alert";
import { NewsletterSubscribedEmail } from "./templates/newsletter-subscribed";
import { WalkAnnouncedEmail } from "./templates/walk-announced";
import { WalkCancelledEmail } from "./templates/walk-cancelled";
import { WalkReopenedEmail } from "./templates/walk-reopened";
import { AddedToWalkEmail } from "./templates/added-to-walk";
import { NoticePostedEmail } from "./templates/notice-posted";
import { ProgressSummaryEmail } from "./templates/progress-summary";
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

/** Invite to become an organiser, pending their acceptance — see
 * setMemberRole in src/server/actions/members.ts. `permissions` is what
 * was actually chosen for this invite (or already on the row, for a
 * resend) — the email lists only those, rather than always promising
 * full access. */
export async function sendOrganiserInviteEmail(
  member: { email: string; firstName: string | null },
  token: string,
  permissions: OrganiserPermissions,
): Promise<void> {
  const brand = await getEmailBrand();
  const copy = await resolveEmailCopy("organiserInvite", {
    firstName: greetingName(member.firstName),
    siteName: brand.siteName,
    expiresInDays: String(ORGANISER_INVITE_EXPIRY_DAYS),
    permissionsList: describeOrganiserPermissions(permissions),
  });
  await sendEmail({
    to: member.email,
    subject: copy.subject,
    react: OrganiserInviteEmail({
      ...brand,
      acceptUrl: `${brand.siteUrl}/organiser-invite/${token}`,
      bodyParagraphs: copy.bodyParagraphs,
    }),
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
 * Builds the email a single member would get for a new walk, without
 * sending it — src/server/actions/walks.ts fans this out to every opted-in
 * member via sendEmailBatch rather than one sendEmail call each. Never
 * batch recipients into one `to:` array instead: that would put every
 * member's address in every other member's inbox.
 */
export async function buildWalkAnnouncedEmail(
  walk: WalkLike & { durationText: string; meetingPoint: string | null; what3words: string | null },
  member: MemberLike,
): Promise<SendEmailInput> {
  const [brand, preferencesUrl] = await Promise.all([getEmailBrand(), memberPreferences(member)]);
  const copy = await resolveEmailCopy("walkAnnounced", {
    firstName: greetingName(member.firstName),
    siteName: brand.siteName,
    walkTitle: walk.title,
    whenText: walk.whenText,
    durationText: walk.durationText,
    meetingPoint: walk.meetingPoint ?? "",
  });
  return {
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
  };
}

/** Single-recipient convenience wrapper around buildWalkAnnouncedEmail —
 * kept for any one-off caller; the opted-in-members fan-out in walks.ts
 * uses the builder directly with sendEmailBatch instead. */
export async function sendWalkAnnouncedEmail(
  walk: WalkLike & { durationText: string; meetingPoint: string | null; what3words: string | null },
  member: MemberLike,
): Promise<void> {
  await sendEmail(await buildWalkAnnouncedEmail(walk, member));
}

/** Same build/send split as buildWalkAnnouncedEmail/sendWalkAnnouncedEmail, for a cancelled walk. */
export async function buildWalkCancelledEmail(
  walk: WalkLike & { reason: string | null },
  member: MemberLike,
): Promise<SendEmailInput> {
  const [brand, preferencesUrl] = await Promise.all([getEmailBrand(), memberPreferences(member)]);
  const copy = await resolveEmailCopy("walkCancelled", {
    firstName: greetingName(member.firstName),
    siteName: brand.siteName,
    walkTitle: walk.title,
    whenText: walk.whenText,
    reason: walk.reason ?? "",
  });
  return {
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
  };
}

export async function sendWalkCancelledEmail(
  walk: WalkLike & { reason: string | null },
  member: MemberLike,
): Promise<void> {
  await sendEmail(await buildWalkCancelledEmail(walk, member));
}

/** Same build/send split as buildWalkAnnouncedEmail/sendWalkAnnouncedEmail, for a reopened walk. */
export async function buildWalkReopenedEmail(
  walk: WalkLike & { durationText: string; meetingPoint: string | null; what3words: string | null },
  member: MemberLike,
): Promise<SendEmailInput> {
  const [brand, preferencesUrl] = await Promise.all([getEmailBrand(), memberPreferences(member)]);
  const copy = await resolveEmailCopy("walkReopened", {
    firstName: greetingName(member.firstName),
    siteName: brand.siteName,
    walkTitle: walk.title,
    whenText: walk.whenText,
    durationText: walk.durationText,
    meetingPoint: walk.meetingPoint ?? "",
  });
  return {
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
  };
}

export async function sendWalkReopenedEmail(
  walk: WalkLike & { durationText: string; meetingPoint: string | null; what3words: string | null },
  member: MemberLike,
): Promise<void> {
  await sendEmail(await buildWalkReopenedEmail(walk, member));
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

/** New notice posted — builds the email for one member without sending it;
 * src/server/actions/notices.ts fans this out via sendEmailBatch, same
 * pattern as buildWalkAnnouncedEmail. */
export async function buildNoticePostedEmail(
  notice: { title: string; body: string; noticeUrl: string },
  member: MemberLike,
): Promise<SendEmailInput> {
  const [brand, preferencesUrl] = await Promise.all([getEmailBrand(), memberPreferences(member)]);
  const copy = await resolveEmailCopy("noticePosted", {
    firstName: greetingName(member.firstName),
    siteName: brand.siteName,
    noticeTitle: notice.title,
  });
  return {
    to: member.email,
    subject: copy.subject,
    react: NoticePostedEmail({
      ...brand,
      title: notice.title,
      noticeBody: notice.body,
      noticeUrl: notice.noticeUrl,
      preferencesUrl,
      bodyParagraphs: copy.bodyParagraphs,
    }),
  };
}

export async function sendNoticePostedEmail(
  notice: { title: string; body: string; noticeUrl: string },
  member: MemberLike,
): Promise<void> {
  await sendEmail(await buildNoticePostedEmail(notice, member));
}

/** Monthly progress recap — builds the email for one member without
 * sending it; the monthly-progress cron fans this out via sendEmailBatch
 * (whole-batch idempotency there, keyed by month, takes the place of this
 * used to carry a per-member idempotencyKey — Resend's batch endpoint only
 * supports one idempotency key per call, not per email inside it). */
export async function buildProgressSummaryEmail(
  summary: {
    /** Human-readable, e.g. "August" — shown in the email. */
    monthLabel: string;
    monthCount: number;
    streakWeeks: number;
    yearCount: number;
    together: { goal: number; count: number } | null;
  },
  member: MemberLike,
): Promise<SendEmailInput> {
  const [brand, preferencesUrl] = await Promise.all([getEmailBrand(), memberPreferences(member)]);
  const copy = await resolveEmailCopy("progressSummary", {
    firstName: greetingName(member.firstName),
    siteName: brand.siteName,
    monthLabel: summary.monthLabel,
  });
  return {
    to: member.email,
    subject: copy.subject,
    react: ProgressSummaryEmail({
      ...brand,
      monthLabel: summary.monthLabel,
      monthCount: summary.monthCount,
      streakWeeks: summary.streakWeeks,
      yearCount: summary.yearCount,
      together: summary.together,
      preferencesUrl,
      bodyParagraphs: copy.bodyParagraphs,
    }),
  };
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
