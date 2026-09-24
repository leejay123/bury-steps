/**
 * Clerk actor-token sign-in URLs (impersonation). Only these hosts may be
 * assigned via window.location after startImpersonation — an unexpected
 * href from the API must not become an open redirect.
 *
 * Includes this site's Clerk CNAME / account portal (same hosts as
 * ACCOUNT_PORTAL_ORIGIN / clerk.* in proxy comments) so production actor
 * tickets aren't rejected after the allowlist was added.
 */
export function isTrustedClerkActorUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    return (
      host === "clerk.com" ||
      host.endsWith(".clerk.com") ||
      host.endsWith(".clerk.accounts.dev") ||
      host.endsWith(".accounts.dev") ||
      host === "accounts.burysteps-walkinggroup.co.uk" ||
      host === "clerk.burysteps-walkinggroup.co.uk"
    );
  } catch {
    return false;
  }
}
