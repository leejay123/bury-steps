export const MAX_CONTACT_NAME = 100;
export const MAX_CONTACT_EMAIL = 254;
export const MIN_CONTACT_MESSAGE = 10;
export const MAX_CONTACT_MESSAGE = 2000;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export function parseContactMessage(raw: string): string | "invalid" {
  const message = raw.trim();
  if (message.length < MIN_CONTACT_MESSAGE || message.length > MAX_CONTACT_MESSAGE) {
    return "invalid";
  }
  return message;
}
