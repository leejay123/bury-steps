import { formatTime } from "@/lib/dates";
import { walkSharePath } from "@/lib/walk-slug";

/** How far ahead a cron run will still catch a walk that is about to start. */
export const PUSH_LEAD_MS = 70 * 60 * 1000;
/** Still send if the job runs a few minutes after the published start. */
export const PUSH_GRACE_MS = 10 * 60 * 1000;

export type StartingSoonWalk = {
  id: string;
  title: string;
  startsAt: Date;
  slug: string | null;
  token: string;
};

export function startingSoonPushWindow(now: Date): { from: Date; until: Date } {
  return {
    from: new Date(now.getTime() - PUSH_GRACE_MS),
    until: new Date(now.getTime() + PUSH_LEAD_MS),
  };
}

/** The alert a member sees about an hour before a walk. */
export function startingSoonPushPayload(walk: StartingSoonWalk): {
  title: string;
  body: string;
  url: string;
} {
  const when = formatTime(walk.startsAt);
  return {
    title: "Walk starting soon",
    body: when
      ? `${walk.title} starts at ${when}. Open it to clock in.`
      : `${walk.title} is starting soon. Open it to clock in.`,
    url: walkSharePath(walk),
  };
}

/** Browsers only accept an https push endpoint (localhost is for development). */
export function pushEndpointAllowed(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    if (url.protocol === "https:") return true;
    return url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1");
  } catch {
    return false;
  }
}
