export const NAV_COOKIE = "bs-nav";

/** One letter, so the header avatar is the right person before the account loads. */
export const AVATAR_COOKIE = "bs-av";

/** The member's Clerk photo address, so a refresh shows the photo at once instead of a letter. */
export const AVATAR_IMAGE_COOKIE = "bs-avimg";

/**
 * The photo address as Clerk's account button loads it (?width=160), so the
 * placeholder and the real button share one cached image. Only Clerk's image
 * host is accepted: the value is drawn into the page before anything checks it.
 */
export function avatarImageSrc(raw: string | undefined | null): string | null {
  if (!raw) return null;
  let url = raw;
  try {
    url = decodeURIComponent(raw);
  } catch {
    return null;
  }
  if (!/^https:\/\/img\.clerk\.com\/[A-Za-z0-9._~=\-]+$/.test(url)) return null;
  return `${url}?width=160`;
}

/** Pages under the phone bar's More (paths only), so the remembered bar highlights More on them too. */
export const MORE_COOKIE = "bs-more";

/**
 * The phone bar's More pages for a signed-in member, as SiteBottomNav lists
 * them (pages beyond the first BOTTOM_BAR_TABS, History for organisers,
 * account and site pages). For /api/remember-menu, before the bar has saved
 * its own list.
 */
export function memberMoreHrefs(items: { href: string }[], isAdmin: boolean): string[] {
  const rest = items.slice(BOTTOM_BAR_TABS).map((item) => item.href);
  return [
    ...rest,
    ...(isAdmin && !rest.includes("/history") ? ["/history"] : []),
    "/email-preferences",
    "/contact",
    "/apps",
    "/privacy-policy",
    "/terms-of-service",
  ];
}

/** "1" when the header shows the site search (owners only), so a refresh draws it or leaves it out at once. */
export const SEARCH_COOKIE = "bs-search";

/** Only owners get the site search in the header; members and organisers don't. */
export function showsHeaderSearch(user: { isOwner?: boolean | null } | null | undefined): boolean {
  return user?.isOwner === true;
}

/** Phone bottom-bar tabs last shown, so a refresh can draw that bar at once. */
export const BAR_COOKIE = "bs-bar";

/**
 * Set for a minute once the server has filled the cookies above right after
 * sign-in (/api/remember-menu), so the proxy can't keep sending someone there
 * if their menu can't be worked out.
 */
export const MENU_FILLED_COOKIE = "bs-menu-filled";

/** Where /api/remember-menu carries on to: only a path on this site, never another site (//evil.example) or a full URL. */
export function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return "/";
  return raw;
}

/** How many menu pages fit in the phone bottom bar (the rest go under More). */
export const BOTTOM_BAR_TABS = 4;

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
