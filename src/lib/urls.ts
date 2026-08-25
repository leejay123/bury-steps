/** Paths Clerk uses for hosted sign-in / sign-up. Hardcoded so they are not env vars. */
export const SIGN_IN_PATH = "/sign-in";
export const SIGN_UP_PATH = "/sign-up";
export const AFTER_AUTH_PATH = "/dashboard";

/**
 * Public origin for share links. On Vercel this is your deployment URL.
 * Override with NEXT_PUBLIC_APP_URL only if you use a custom domain.
 */
export function appUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (explicit) return explicit;

  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (host) return `https://${host}`;

  return "http://localhost:3000";
}
