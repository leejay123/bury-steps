import { timingSafeEqual } from "node:crypto";

/**
 * Compare an Authorization header to `Bearer ${secret}` without leaking
 * the secret length via early string inequality exits.
 */
export function bearerMatches(authorization: string | null, secret: string | undefined): boolean {
  if (!secret || !authorization) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(authorization);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
