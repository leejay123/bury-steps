/**
 * One entry per system email — the single source of truth for its default
 * subject/body wording, which placeholders it accepts, and what triggers
 * it. src/lib/email/overrides.ts reads this to fall back on when there's
 * no admin-edited row; the admin UI (src/app/admin/settings/emails) reads
 * it to render the edit form and the placeholder legend.
 *
 * Only the subject line and the main prose paragraph(s) are covered here —
 * the shared layout (logo, heading, button, footer) and any data-driven
 * facts (a walk's time and place, a message's sender) are rendered by the
 * template component itself and never stored as editable text.
 */

export type EmailTemplateKey =
  | "welcome"
  | "accountDeleted"
  | "adminPromoted"
  | "contactReceived"
  | "contactAdminAlert"
  | "newsletterSubscribed"
  | "walkAnnounced"
  | "walkCancelled"
  | "addedToWalk"
  | "accidentReportAlert";

/** An admin's saved subject/body for one template — both null means "no row, use the default". */
export type EmailTemplateOverrideValues = { subject: string | null; body: string | null };

export type EmailTemplateMeta = {
  key: EmailTemplateKey;
  label: string;
  /** One line: when this email goes out. */
  trigger: string;
  /** Section heading the admin UI groups this under. */
  category: "Member lifecycle" | "Walks" | "Contact & newsletter" | "Organiser alerts";
  /** `{token}` names usable in this email's subject/body, with a plain-English description. */
  placeholders: { token: string; description: string }[];
  defaultSubject: string;
  /** Paragraphs separated by a blank line. May be empty — some alerts have no intro prose by default. */
  defaultBody: string;
};

export const EMAIL_TEMPLATES: EmailTemplateMeta[] = [
  {
    key: "welcome",
    label: "Welcome",
    trigger: "Sent when someone signs up.",
    category: "Member lifecycle",
    placeholders: [
      { token: "firstName", description: "Their first name (\"there\" if not set)" },
      { token: "siteName", description: "Your site's name" },
      { token: "siteUrl", description: "Your site's web address" },
    ],
    defaultSubject: "Welcome to {siteName}",
    defaultBody:
      "Thanks for joining {siteName}. Upcoming walks show up on your dashboard, and you'll get an email when a new one is posted — location, meeting point, start time, and a link to clock in on the day.\n\nCome as you are — no winners, no losers, just people walking together.",
  },
  {
    key: "accountDeleted",
    label: "Account deleted",
    trigger: "Sent when a member's account is deleted (by themselves or an organiser).",
    category: "Member lifecycle",
    placeholders: [
      { token: "firstName", description: "Their first name (\"there\" if not set)" },
      { token: "siteName", description: "Your site's name" },
    ],
    defaultSubject: "Your {siteName} account has been deleted",
    defaultBody:
      "Hi {firstName}, this confirms your {siteName} account — along with your walk and clock-in history — has been permanently deleted.\n\nIf you didn't ask for this, or you'd like to walk with us again, get in touch with an organiser and they can help.",
  },
  {
    key: "adminPromoted",
    label: "Promoted to organiser",
    trigger: "Sent when a member is made an organiser.",
    category: "Member lifecycle",
    placeholders: [
      { token: "firstName", description: "Their first name (\"there\" if not set)" },
      { token: "siteName", description: "Your site's name" },
      { token: "siteUrl", description: "Your site's web address" },
    ],
    defaultSubject: "You're now an organiser of {siteName}",
    defaultBody:
      "Hi {firstName}, another organiser has given you organiser access on {siteName}. You can now create and edit walks, manage members, and see who's coming on each walk.\n\nDidn't expect this? Let another organiser know.",
  },
  {
    key: "contactReceived",
    label: "Contact form — confirmation to sender",
    trigger: "Sent to whoever submits the public contact form.",
    category: "Contact & newsletter",
    placeholders: [
      { token: "name", description: "The name they gave" },
      { token: "email", description: "The email address they gave" },
      { token: "message", description: "Their message" },
      { token: "siteName", description: "Your site's name" },
    ],
    defaultSubject: "We've got your message — {siteName}",
    defaultBody: "Hi {name}, thanks for getting in touch with {siteName}. An organiser will get back to you as soon as they can.",
  },
  {
    key: "contactAdminAlert",
    label: "Contact form — alert to organisers",
    trigger: "Sent to every organiser when the contact form is submitted.",
    category: "Organiser alerts",
    placeholders: [
      { token: "name", description: "The sender's name" },
      { token: "email", description: "The sender's email address" },
      { token: "message", description: "Their message" },
      { token: "siteName", description: "Your site's name" },
    ],
    defaultSubject: "New contact form message from {name}",
    defaultBody: "",
  },
  {
    key: "newsletterSubscribed",
    label: "Newsletter subscribed",
    trigger: "Sent when someone subscribes via the footer form.",
    category: "Contact & newsletter",
    placeholders: [{ token: "siteName", description: "Your site's name" }],
    defaultSubject: "You're subscribed — {siteName}",
    defaultBody:
      "Thanks for subscribing to the {siteName} newsletter. Expect occasional updates on walks and group news — nothing more often than that.",
  },
  {
    key: "walkAnnounced",
    label: "New walk announced",
    trigger: "Sent to every member opted into walk announcements when a walk is created.",
    category: "Walks",
    placeholders: [
      { token: "firstName", description: "Their first name (\"there\" if not set)" },
      { token: "siteName", description: "Your site's name" },
      { token: "walkTitle", description: "The walk's title" },
      { token: "whenText", description: "Date and time, e.g. \"Sun 7 Sep, 14:30\"" },
      { token: "durationText", description: "Length, e.g. \"1 hour 30 minutes\"" },
      { token: "meetingPoint", description: "Meeting point, if one is set" },
    ],
    defaultSubject: "New walk: {walkTitle}",
    defaultBody: "Hi {firstName}, a new walk has been posted. Clock in from an hour before it starts.",
  },
  {
    key: "walkCancelled",
    label: "Walk cancelled",
    trigger: "Sent to every member opted into walk announcements when a walk is cancelled.",
    category: "Walks",
    placeholders: [
      { token: "firstName", description: "Their first name (\"there\" if not set)" },
      { token: "siteName", description: "Your site's name" },
      { token: "walkTitle", description: "The walk's title" },
      { token: "whenText", description: "The walk's original date and time" },
      { token: "reason", description: "The cancellation reason, if one was given" },
    ],
    defaultSubject: "Walk cancelled: {walkTitle}",
    defaultBody: "Hi {firstName}, this walk has been cancelled — no need to turn up.",
  },
  {
    key: "addedToWalk",
    label: "Added to a walk",
    trigger: "Sent to a member when an organiser manually adds them to a walk.",
    category: "Walks",
    placeholders: [
      { token: "firstName", description: "Their first name (\"there\" if not set)" },
      { token: "siteName", description: "Your site's name" },
      { token: "walkTitle", description: "The walk's title" },
      { token: "whenText", description: "Date and time" },
      { token: "meetingPoint", description: "Meeting point, if one is set" },
    ],
    defaultSubject: "You've been added to {walkTitle}",
    defaultBody: "Hi {firstName}, an organiser has added you as attending {walkTitle}.",
  },
  {
    key: "accidentReportAlert",
    label: "Accident report logged",
    trigger: "Sent to every other organiser when one of them logs an accident report.",
    category: "Organiser alerts",
    placeholders: [
      { token: "createdByName", description: "The organiser who logged it" },
      { token: "whenText", description: "When it happened" },
      { token: "walkTitle", description: "The linked walk's title, if one was chosen" },
      { token: "whoInvolved", description: "Who was involved" },
      { token: "siteName", description: "Your site's name" },
    ],
    defaultSubject: "New accident report logged",
    defaultBody: "",
  },
];

const BY_KEY = new Map(EMAIL_TEMPLATES.map((meta) => [meta.key, meta]));

export function getEmailTemplateMeta(key: EmailTemplateKey): EmailTemplateMeta {
  const meta = BY_KEY.get(key);
  if (!meta) throw new Error(`Unknown email template key: ${key}`);
  return meta;
}

export function isEmailTemplateKey(value: string): value is EmailTemplateKey {
  return BY_KEY.has(value as EmailTemplateKey);
}
