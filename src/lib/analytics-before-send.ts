import type { BeforeSend, BeforeSendEvent } from "@vercel/analytics";

/**
 * Paths whose trailing segments are capability or share credentials.
 * Full URLs must never reach Vercel Analytics (project access / exports
 * would otherwise recover live invite, prefs, unsubscribe, or walk-share
 * tokens).
 */
const CAPABILITY_PATH_PREFIXES = [
  "/organiser-invite/",
  "/email-preferences/",
  "/w/",
] as const;

function pathnameFromAnalyticsUrl(url: string): string | null {
  try {
    // Analytics may send an absolute URL or a path-only string.
    if (url.startsWith("/")) return url.split("?")[0] ?? url;
    return new URL(url).pathname;
  } catch {
    return null;
  }
}

/** Drop pageviews/events for tokenised routes; return the event otherwise. */
export function redactCapabilityAnalyticsEvent(event: BeforeSendEvent): BeforeSendEvent | null {
  const path = pathnameFromAnalyticsUrl(event.url);
  if (!path) return event;
  if (CAPABILITY_PATH_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return null;
  }
  return event;
}

export const analyticsBeforeSend: BeforeSend = redactCapabilityAnalyticsEvent;
