/**
 * Paths whose trailing segments are capability or share credentials.
 * Full URLs must never reach Vercel Analytics or Speed Insights (project
 * access / exports would otherwise recover live invite, prefs, unsubscribe,
 * or walk-share tokens).
 */
const CAPABILITY_PATH_PREFIXES = [
  "/organiser-invite/",
  "/email-preferences/",
  "/w/",
] as const;

function pathnameFromTelemetryUrl(url: string): string | null {
  try {
    // Telemetry may send an absolute URL or a path-only string.
    if (url.startsWith("/")) return url.split("?")[0] ?? url;
    return new URL(url).pathname;
  } catch {
    return null;
  }
}

type UrlEvent = { url: string };

/**
 * Drop telemetry events for tokenised routes. Shared by Analytics and
 * Speed Insights `beforeSend` (both pass an event with `url`).
 */
export function redactCapabilityTelemetryEvent<T extends UrlEvent>(event: T): T | null {
  const path = pathnameFromTelemetryUrl(event.url);
  if (!path) return event;
  if (CAPABILITY_PATH_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return null;
  }
  return event;
}

export const telemetryBeforeSend = redactCapabilityTelemetryEvent;
