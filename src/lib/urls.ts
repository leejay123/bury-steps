/** Clerk Account Portal (custom domain). Sign-in and join happen here. */
export const ACCOUNT_PORTAL_ORIGIN = "https://accounts.burysteps-walkinggroup.co.uk";
export const SIGN_IN_URL = `${ACCOUNT_PORTAL_ORIGIN}/sign-in`;
export const SIGN_UP_URL = `${ACCOUNT_PORTAL_ORIGIN}/sign-up`;

/** On-site paths that bounce to the Account Portal, so old links still work. */
export const SIGN_IN_PATH = "/sign-in";
export const SIGN_UP_PATH = "/sign-up";
export const AFTER_AUTH_PATH = "/dashboard";

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

function trustedOrigins(): Set<string> {
  const origins = new Set<string>([
    new URL(PRODUCTION_APP_URL).origin,
    "https://www.burysteps-walkinggroup.co.uk",
    new URL(appUrl()).origin,
  ]);
  if (process.env.VERCEL_URL) {
    origins.add(`https://${process.env.VERCEL_URL}`);
  }
  return origins;
}

/** True when the URL is on this site, not an attacker-controlled host. */
export function isTrustedAppUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    if (url.username || url.password) return false;
    if (!url.pathname.startsWith("/")) return false;
    return trustedOrigins().has(url.origin);
  } catch {
    return false;
  }
}

function firstString(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string" && value.length > 0) return value;
  if (Array.isArray(value) && typeof value[0] === "string" && value[0].length > 0) {
    return value[0];
  }
  return undefined;
}

export function accountPortalUrl(
  which: "sign-in" | "sign-up",
  searchParams?: Record<string, string | string[] | undefined>,
): string {
  const url = new URL(which === "sign-in" ? SIGN_IN_URL : SIGN_UP_URL);
  const redirectTo = firstString(searchParams?.redirect_url);
  if (redirectTo && isTrustedAppUrl(redirectTo)) {
    url.searchParams.set("redirect_url", redirectTo);
  }
  return url.toString();
}

export function accountPortalHref(which: "sign-in" | "sign-up", returnTo: string): string {
  const url = new URL(which === "sign-in" ? SIGN_IN_URL : SIGN_UP_URL);
  const safeReturn = isTrustedAppUrl(returnTo) ? returnTo : `${appUrl()}${AFTER_AUTH_PATH}`;
  url.searchParams.set("redirect_url", safeReturn);
  return url.toString();
}
