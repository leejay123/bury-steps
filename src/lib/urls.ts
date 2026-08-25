/** Paths Clerk uses for hosted sign-in / sign-up. Hardcoded so they are not env vars. */
export const SIGN_IN_PATH = "/sign-in";
export const SIGN_UP_PATH = "/sign-up";
export const AFTER_AUTH_PATH = "/dashboard";

/**
 * Public origin for share links.
 * Localhost in dev; Vercel provides the host in production. Override with
 * NEXT_PUBLIC_APP_URL only if you use a custom domain that Vercel does not know.
 */
export function appUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (explicit) return explicit;

  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (host) return `https://${host}`;

  return "http://localhost:3000";
}
