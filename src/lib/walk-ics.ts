import { appUrl } from "@/lib/urls";
import { walkShareUrl } from "@/lib/walk-slug";

type WalkIcsInput = {
  title: string;
  description: string | null;
  location: string | null;
  postcode: string | null;
  startsAt: Date;
  durationMins: number;
  token: string;
  slug: string | null;
  cancelledAt?: Date | null;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** UTC timestamp in the compact form ICS wants: 20260830T140000Z */
function icsUtc(date: Date): string {
  return (
    `${date.getUTCFullYear()}${pad2(date.getUTCMonth() + 1)}${pad2(date.getUTCDate())}` +
    `T${pad2(date.getUTCHours())}${pad2(date.getUTCMinutes())}${pad2(date.getUTCSeconds())}Z`
  );
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function foldLine(line: string): string {
  // RFC 5545: lines longer than 75 octets should be folded with CRLF + space.
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let remaining = line;
  chunks.push(remaining.slice(0, 75));
  remaining = remaining.slice(75);
  while (remaining.length > 0) {
    chunks.push(` ${remaining.slice(0, 74)}`);
    remaining = remaining.slice(74);
  }
  return chunks.join("\r\n");
}

/**
 * Builds a single-event .ics file for a walk so phones and calendars can
 * add it. Times are stored as UTC (Z); calendar apps convert to the user's
 * local zone. The share URL is included so the invite still points at the
 * live walk page.
 */
export function buildWalkIcs(walk: WalkIcsInput): string {
  const endsAt = new Date(walk.startsAt.getTime() + walk.durationMins * 60_000);
  const url = walkShareUrl(appUrl(), { token: walk.token, slug: walk.slug });
  const meeting = [walk.location, walk.postcode].filter(Boolean).join(", ");
  const title = walk.cancelledAt ? `Cancelled: ${walk.title}` : walk.title;
  const descriptionParts = [
    walk.description?.trim() || null,
    walk.cancelledAt ? "This walk has been cancelled." : null,
    `Open: ${url}`,
  ].filter(Boolean);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Bury Steps Walking Group//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:walk-${walk.token}@burysteps-walkinggroup.co.uk`,
    `DTSTAMP:${icsUtc(new Date())}`,
    `DTSTART:${icsUtc(walk.startsAt)}`,
    `DTEND:${icsUtc(endsAt)}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(descriptionParts.join("\n\n"))}`,
    meeting ? `LOCATION:${escapeIcsText(meeting)}` : null,
    `URL:${url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((line): line is string => line !== null);

  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}

export function walkIcsFilename(startsAt: Date): string {
  return `bury-steps-${startsAt.toISOString().slice(0, 10)}.ics`;
}
