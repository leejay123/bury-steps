import { appUrl } from "@/lib/urls";
import { walkShareUrl } from "@/lib/walk-slug";
import { londonDateKey } from "@/lib/dates";

type WalkIcsInput = {
  /** Stable primary key — used in UID so calendars keep one event if the share token changes. */
  id: string;
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
  return (
    value
      // Textarea input arrives with CRLF line endings; a bare CR left in a
      // property value corrupts the file, so normalise before escaping.
      .replace(/\r\n?/g, "\n")
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;")
  );
}

const utf8 = new TextEncoder();

/**
 * RFC 5545 §3.1: content lines are folded at 75 *octets*, continuation
 * lines starting with a space. Counting characters let lines with curly
 * quotes, accents or emoji run over, and slicing by UTF-16 unit could cut
 * an emoji in half — so this walks whole code points and counts bytes.
 */
function foldLine(line: string): string {
  if (utf8.encode(line).length <= 75) return line;
  const chunks: string[] = [];
  let current = "";
  let currentBytes = 0;
  for (const char of line) {
    const bytes = utf8.encode(char).length;
    if (currentBytes + bytes > 75) {
      chunks.push(current);
      current = " ";
      currentBytes = 1;
    }
    current += char;
    currentBytes += bytes;
  }
  chunks.push(current);
  return chunks.join("\r\n");
}

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
    `UID:walk-${walk.id}@burysteps-walkinggroup.co.uk`,
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
  return `bury-steps-${londonDateKey(startsAt)}.ics`;
}
