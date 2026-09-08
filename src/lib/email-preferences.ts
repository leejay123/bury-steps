/** Shared by both preference forms — the public /email-preferences/[token]
 * page (reached from an email footer link) and the authenticated
 * /email-preferences page (reached from the account menu while signed in). */
export type EmailPreferences = {
  emailWalkAnnouncements: boolean;
  emailNotices: boolean;
  emailProgress: boolean;
  emailNewsletter: boolean;
  emailContactAlerts: boolean;
  emailAccidentAlerts: boolean;
};

export const EMAIL_PREFERENCE_OPTIONS: {
  name: keyof EmailPreferences;
  label: string;
  hint: string;
  /** Only shown to organisers — this preference is never consulted for a
   * plain member (see notifyAdminsOfContactMessage /
   * notifyOtherAdminsOfAccidentReport), so there's nothing for them to opt
   * out of. */
  adminOnly?: boolean;
}[] = [
  {
    name: "emailWalkAnnouncements",
    label: "Walk announcements",
    hint: "New walks, changes, and cancellations.",
  },
  { name: "emailNotices", label: "Notices", hint: "A digest when a new notice is posted." },
  { name: "emailProgress", label: "Progress", hint: "Your walk history and group goal updates." },
  { name: "emailNewsletter", label: "Newsletter", hint: "Occasional group news." },
  {
    name: "emailContactAlerts",
    label: "Contact form messages",
    hint: "New messages submitted through the contact form.",
    adminOnly: true,
  },
  {
    name: "emailAccidentAlerts",
    label: "Accident reports",
    hint: "New accident reports logged by other organisers.",
    adminOnly: true,
  },
];
