import { customAlphabet } from "nanoid";

/** How long an organiser-invite link stays valid before it must be resent. */
export const ORGANISER_INVITE_EXPIRY_DAYS = 7;

// Same unambiguous alphabet as other one-click tokens in this app (walk
// share tokens, the email-preferences unsubscribe token) — this one grants
// unauthenticated organiser access, so it needs real entropy.
export const makeOrganiserInviteToken = customAlphabet("abcdefghjkmnpqrstuvwxyz23456789", 24);

export function organiserInviteExpiresAt(from = new Date()): Date {
  return new Date(from.getTime() + ORGANISER_INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
}
