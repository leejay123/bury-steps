export const NAV_COOKIE = "bs-nav";

/** One letter, so the header avatar is the right person before the account loads. */
export const AVATAR_COOKIE = "bs-av";

export type RememberedNavItem = { href: string; label: string };

/** The menu last shown in the header, so a refresh can draw those links at once. */
export function parseRememberedNav(raw: string | undefined): RememberedNavItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .flatMap((item) => {
        if (!item || typeof item.href !== "string" || typeof item.label !== "string") return [];
        if (!item.href.startsWith("/") || item.href.startsWith("//") || item.label.length > 40) return [];
        return [{ href: item.href, label: item.label }];
      })
      .slice(0, 16);
  } catch {
    return [];
  }
}
