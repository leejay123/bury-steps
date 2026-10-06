import { isClerkImageUrl } from "@/components/header-chrome";

export const NAV_COOKIE = "bs-nav";

/** One letter, so the header avatar is the right person before the account loads. */
export const AVATAR_COOKIE = "bs-av";

/** The avatar picture Clerk showed last time and whose it was, drawn until Clerk's code loads. */
export const AVATAR_IMAGE_COOKIE = "bs-av-img";

/** The bell's unread count last time, so its badge is there before the notices load. */
export const UNREAD_COOKIE = "bs-unread";

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

/** The remembered unread count: a whole number from 0 to 99, otherwise 0. */
export function parseRememberedUnread(raw: string | undefined): number {
  if (!raw || !/^\d{1,2}$/.test(raw)) return 0;
  return Number(raw);
}

/**
 * The remembered avatar picture and whose it was ("<Clerk user id>|<link>"),
 * so the server never draws one person's photo for someone else who signs
 * in on the same browser. Only Clerk image links are accepted.
 */
export function parseRememberedAvatar(raw: string | undefined): { clerkId: string; url: string } | null {
  if (!raw) return null;
  try {
    const value = decodeURIComponent(raw);
    const split = value.indexOf("|");
    if (split < 1) return null;
    const url = value.slice(split + 1);
    return isClerkImageUrl(url) ? { clerkId: value.slice(0, split), url } : null;
  } catch {
    return null;
  }
}
