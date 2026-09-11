/**
 * First letters of up to the first two "words" in a name, for an avatar
 * fallback — splits on spaces, @, or . so an email address works too (e.g.
 * "jo.bloggs@example.com" -> "JB").
 */
export function initials(name: string): string {
  return name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
