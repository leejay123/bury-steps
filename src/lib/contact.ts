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

export function parseContactEmail(raw: string): string | "invalid" {
  const email = raw.trim();
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
