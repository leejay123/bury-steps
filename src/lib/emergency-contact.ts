const NAME_MAX = 80;
const PHONE_MAX = 30;

export const EMERGENCY_CONTACT_REQUIRED_MESSAGE =
  "Add an emergency contact name and phone number before clocking in.";

export const EMERGENCY_CONTACT_PAIR_MESSAGE =
  "Add both a name and a phone number, or leave both blank.";

export const EMERGENCY_CONTACT_NAME_MESSAGE = "Enter the emergency contact’s name.";

export const EMERGENCY_CONTACT_PHONE_MESSAGE =
  "Enter a phone number we can call, with no extra words.";

export type EmergencyContactResult =
  | { ok: true; name: string | null; phone: string | null }
  | { ok: false; error: string };

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Enough digits for a real number, and nothing that isn't part of one. */
export function isPlausiblePhone(phone: string): boolean {
  if (phone.length === 0 || phone.length > PHONE_MAX) return false;
  if (!/^[+()\d\s.-]+$/.test(phone)) return false;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

/** `tel:` href, digits and a leading + only. */
export function emergencyPhoneHref(phone: string): string {
  const leadingPlus = phone.trim().startsWith("+");
  const digits = phone.replace(/\D/g, "");
  return `tel:${leadingPlus ? "+" : ""}${digits}`;
}

/**
 * Both fields together, or neither. A name without a number (or the other
 * way round) is not a contact anyone can use. When `required` is false,
 * leaving both blank clears a contact already saved on the account.
 */
export function parseEmergencyContact(
  nameRaw: unknown,
  phoneRaw: unknown,
  required: boolean,
): EmergencyContactResult {
  const name = asText(nameRaw);
  const phone = asText(phoneRaw);

  if (!name && !phone) {
    if (required) return { ok: false, error: EMERGENCY_CONTACT_REQUIRED_MESSAGE };
    return { ok: true, name: null, phone: null };
  }

  if (!name || !phone) {
    return {
      ok: false,
      error: required ? EMERGENCY_CONTACT_REQUIRED_MESSAGE : EMERGENCY_CONTACT_PAIR_MESSAGE,
    };
  }

  if (name.length < 2 || name.length > NAME_MAX || !/\p{L}/u.test(name)) {
    return { ok: false, error: EMERGENCY_CONTACT_NAME_MESSAGE };
  }

  if (!isPlausiblePhone(phone)) {
    return { ok: false, error: EMERGENCY_CONTACT_PHONE_MESSAGE };
  }

  return { ok: true, name, phone };
}
