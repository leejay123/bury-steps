/**
 * A what3words address, stored as plain text — never resolved through
 * what3words' API. Their free tier only covers AutoSuggest (spelling
 * suggestions); actually converting an address to coordinates needs a paid
 * plan. We don't need either: what3words.com's own page for an address is
 * free for anyone to open, shows the exact 3m×3m square on a map, and
 * already has "Open in Google Maps"/"Apple Maps" buttons — so a plain link
 * to it gives members pinpoint-accurate directions without this app ever
 * making an API call, needing a key, or being subject to a rate limit.
 *
 * This is a second, optional way to find the meeting point — the existing
 * postcode/address search and its map are untouched either way.
 */

/**
 * Three words, dot-separated, letters only (with the odd non-English
 * accented letter or apostrophe in some languages' word lists) — deliberately
 * not a real dictionary check, since that would need the very API call this
 * whole approach exists to avoid. Just enough to catch a pasted URL, stray
 * punctuation, or an obviously-not-an-address typo before it's saved.
 */
const WHAT3WORDS_PATTERN = /^[\p{L}'-]+\.[\p{L}'-]+\.[\p{L}'-]+$/u;

/**
 * Accepts what someone's likely to paste — the bare address, a leading
 * `///` (how the what3words app displays and copies one), or a full
 * what3words.com share link — and returns the bare, lowercased address, or
 * null if it doesn't look like one at all.
 */
export function normalizeWhat3Words(input: string | null | undefined): string | null {
  let value = (input ?? "").trim();
  if (!value) return null;

  const afterSlashes = value.match(/^\/{3}\s*(.+)$/);
  if (afterSlashes) value = afterSlashes[1].trim();

  const afterUrl = value.match(/^(?:https?:\/\/)?(?:www\.)?what3words\.com\/(.+)$/i);
  if (afterUrl) value = afterUrl[1].trim();

  value = value.toLowerCase();
  return WHAT3WORDS_PATTERN.test(value) ? value : null;
}

/** what3words' own free public page for an address — no API key needed. */
export function what3wordsUrl(address: string): string {
  return `https://what3words.com/${encodeURIComponent(address)}`;
}
