/**
 * Fills `{token}` placeholders in admin-edited (or default) email copy.
 * An unrecognized `{token}` is left as-is rather than blanked — a typo in
 * an admin's edit should read as a typo, not silently vanish.
 */
export function fillPlaceholders(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (match, token: string) =>
    Object.prototype.hasOwnProperty.call(vars, token) ? vars[token] : match,
  );
}

/** Splits body copy into paragraphs on blank lines, trimming each — how
 * every email template turns one text block into separate <EmailText>s. */
export function paragraphsFrom(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
