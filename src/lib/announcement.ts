/**
 * The homepage's top strip (the join bar): its words and link, set in
 * Settings → Site behaviour. Stored in SiteSetting.announcementText (as JSON:
 * title, line, link words) and announcementLink (where it goes). Left empty,
 * the strip keeps its usual "New here? Come for a walk." and the sign-up link.
 */
export type AnnouncementCopy = { title: string; line: string; linkLabel: string; href: string };

export const MAX_ANNOUNCEMENT_TITLE = 80;
export const MAX_ANNOUNCEMENT_LINE = 160;
export const MAX_ANNOUNCEMENT_LINK_LABEL = 40;
export const MAX_ANNOUNCEMENT_HREF = 500;

/** Their own words, or null when the strip keeps its usual join wording. */
export function parseAnnouncementCopy(text: string, link: string): AnnouncementCopy | null {
  let title = "";
  let line = "";
  let linkLabel = "";
  try {
    const row = JSON.parse(text || "{}") as Record<string, unknown>;
    if (row && typeof row === "object") {
      title = typeof row.title === "string" ? row.title.trim() : "";
      line = typeof row.line === "string" ? row.line.trim() : "";
      linkLabel = typeof row.linkLabel === "string" ? row.linkLabel.trim() : "";
    }
  } catch {
    // Older plain wording (unused): keep the usual strip.
  }
  if (!title) return null;
  return { title, line, linkLabel, href: cleanAnnouncementHref(link) ?? "" };
}

/** A page on the site (/…) or a full https web address; anything else is dropped. */
export function cleanAnnouncementHref(value: string): string | null {
  const href = value.trim();
  if (!href) return null;
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  try {
    const url = new URL(href);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}
