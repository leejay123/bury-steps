/** Clerk Account Portal (custom domain). Sign-in and join happen here. */
export const ACCOUNT_PORTAL_ORIGIN = "https://accounts.burysteps-walkinggroup.co.uk";
export const SIGN_IN_URL = `${ACCOUNT_PORTAL_ORIGIN}/sign-in`;
export const SIGN_UP_URL = `${ACCOUNT_PORTAL_ORIGIN}/sign-up`;

/** On-site paths that bounce to the Account Portal, so old links still work. */
export const SIGN_IN_PATH = "/sign-in";
export const SIGN_UP_PATH = "/sign-up";
export const AFTER_AUTH_PATH = "/dashboard";

export function accountPortalUrl(
  which: "sign-in" | "sign-up",
  searchParams?: Record<string, string | string[] | undefined>,
): string {
  const url = new URL(which === "sign-in" ? SIGN_IN_URL : SIGN_UP_URL);
  if (!searchParams) return url.toString();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string" && value.length > 0) {
      url.searchParams.set(key, value);
    } else if (Array.isArray(value)) {
      for (const item of value) url.searchParams.append(key, item);
    }
  }
  return url.toString();
}

export function accountPortalHref(which: "sign-in" | "sign-up", returnTo: string): string {
  const url = new URL(which === "sign-in" ? SIGN_IN_URL : SIGN_UP_URL);
  url.searchParams.set("redirect_url", returnTo);
  return url.toString();
}

export const FACEBOOK_GROUP_URL = "https://www.facebook.com/groups/burysteps";

/** Live site. Walk share links and emails should use this, not *.vercel.app. */
export const PRODUCTION_APP_URL = "https://burysteps-walkinggroup.co.uk";

/**
 * Public origin for share links.
 * Production always uses the custom domain. Preview deploys keep their Vercel URL.
 */
export function appUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (explicit) return explicit;

  if (process.env.VERCEL_ENV === "production") return PRODUCTION_APP_URL;

  const host = process.env.VERCEL_URL;
  if (host) return `https://${host}`;

  return "http://localhost:3000";
}
