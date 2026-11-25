export const MAX_CONTACT_NAME = 100;
export const MAX_CONTACT_EMAIL = 254;
export const MAX_CONTACT_PHONE = 30;
export const MIN_CONTACT_MESSAGE = 10;
export const MAX_CONTACT_MESSAGE = 2000;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Loose on purpose — spaces, +, (), - and digits cover UK and international
// formats without rejecting a real number over a strict shape.
const PHONE_PATTERN = /^[\d\s()+-]+$/;

export function parseContactName(raw: string): string | "invalid" {
  const name = raw.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > MAX_CONTACT_NAME) return "invalid";
  return name;
}

/** Lowercased so "Jane@x.com" and "jane@x.com" are treated as the same
 * address everywhere this is used. */
export function parseContactEmail(raw: string): string | "invalid" {
  const email = raw.trim().toLowerCase();
  if (email.length === 0 || email.length > MAX_CONTACT_EMAIL || !EMAIL_PATTERN.test(email)) {
    return "invalid";
  }
  return email;
}

/** Optional — the form doesn't require it. Empty means "not given", not an error. */
export function parseContactPhone(raw: string): string | "invalid" {
  const phone = raw.trim();
  if (phone.length === 0) return "";
  if (phone.length > MAX_CONTACT_PHONE || !PHONE_PATTERN.test(phone)) return "invalid";
  return phone;
}

export function parseContactMessage(raw: string): string | "invalid" {
  const message = raw.trim();
  if (message.length < MIN_CONTACT_MESSAGE || message.length > MAX_CONTACT_MESSAGE) {
    return "invalid";
  }
  return message;
}

/**
 * What a Contact us message is about. The visitor picks one; it decides which
 * committee mailbox gets the email (set in Settings → Site behaviour).
 */
export const CONTACT_TOPICS = [
  {
    value: "SECRETARY",
    role: "Secretary",
    label: "Joining a walk, or a general question",
    defaultEmail: "secretary@burysteps-walkinggroup.co.uk",
  },
  {
    value: "CHAIR",
    role: "Chair",
    label: "Partnerships, complaints, safeguarding, media or funding",
    defaultEmail: "chair@burysteps-walkinggroup.co.uk",
  },
  {
    value: "TREASURER",
    role: "Treasurer",
    label: "Money, fundraising or invoices",
    defaultEmail: "treasurer@burysteps-walkinggroup.co.uk",
  },
] as const;

export type ContactTopic = (typeof CONTACT_TOPICS)[number]["value"];

export const DEFAULT_CONTACT_TOPIC: ContactTopic = "SECRETARY";

/** Anything unrecognised goes to the Secretary, the main public contact. */
export function parseContactTopic(raw: string): ContactTopic {
  return CONTACT_TOPICS.find((topic) => topic.value === raw)?.value ?? DEFAULT_CONTACT_TOPIC;
}

export function contactTopicRole(topic: string): string {
  return CONTACT_TOPICS.find((entry) => entry.value === topic)?.role ?? "Secretary";
}
