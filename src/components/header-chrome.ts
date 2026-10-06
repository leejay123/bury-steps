/**
 * The signed-in header's look, shared by the React header (site-nav.tsx,
 * site-nav-menu.tsx, site-search.tsx, the bell and avatar placeholders) and
 * the script that draws last visit's header while the page is still loading
 * (header-boot.tsx). Both must draw exactly the same thing, or the header
 * visibly changes as the page loads.
 *
 * No "use client" here: a server component (header-boot.tsx) reads these
 * strings, and a client file's exports are only references on the server.
 */

/** The header's middle column, holding the menu row (md and up). */
export const HEADER_NAV_COLUMN_CLASS = "hidden min-w-0 items-center justify-center md:flex";
export const NAV_ROW_WRAPPER_CLASS = "relative hidden min-w-0 md:block";

/**
 * The header's right-hand column (search, bell and avatar), held at the
 * signed-in width — icons on tablets, a search bar from lg — for everyone
 * and in the placeholders too. Its contents change as the header streams in
 * (placeholder, then Sign in/Join or the member's tools) and without a fixed
 * width each change slid the centred menu sideways.
 */
export const HEADER_TOOLS_CLASS =
  "flex min-w-0 items-center justify-end gap-1.5 justify-self-end max-md:col-start-3 max-md:min-w-max md:gap-3 md:min-w-[7.75rem] lg:min-w-[20.5rem]";

/** The menu row (the <nav>), scrolling sideways when the links don't fit. */
export const NAV_ROW_CLASS =
  "flex max-w-full items-center justify-center-safe gap-1 overflow-x-auto overscroll-x-contain text-[14px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

// A fixed 14px, not text-sm: text-sm follows Settings → Branding → Text
// sizes → Body, and a bigger body size made the desktop menu too large.
// The current page keeps the same weight as the rest (only colour and the
// grey pill change) — bolder text is wider, so it looked like the item grew
// and nudged its neighbours when clicked.
const NAV_LINK_BASE =
  "relative inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-[14px] transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset";

export function navLinkClass(active: boolean) {
  return `${NAV_LINK_BASE} ${active ? "text-foreground" : "text-muted-foreground hover:bg-muted"}`;
}

/** The grey pill behind the current page's link. */
export const NAV_ACTIVE_PILL_CLASS = "absolute inset-0 rounded-md bg-muted";
export const NAV_LINK_LABEL_CLASS = "relative z-10 inline-flex items-center gap-1.5";
export const NAV_ICON_CLASS = "size-4 shrink-0";

/** Lucide's drawings for the menu icons, as the inside of a 24×24 <svg>.
 * header-chrome.test.ts checks them against lucide-react's own. */
export const NAV_ICON_SVG: Record<string, string> = {
  Home: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>',
  Walks:
    '<path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"></path><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"></path><path d="M16 17h4"></path><path d="M4 13h4"></path>',
  Notices:
    '<path d="M10.268 21a2 2 0 0 0 3.464 0"></path><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"></path>',
  Progress:
    '<path d="M3 3v16a2 2 0 0 0 2 2h16"></path><path d="M18 17V9"></path><path d="M13 17V5"></path><path d="M8 17v-3"></path>',
  History:
    '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M12 7v5l4 2"></path>',
  Members:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>',
  Messages: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>',
  Reports:
    '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M8 18v-2"></path><path d="M12 18v-4"></path><path d="M16 18v-6"></path>',
  Settings:
    '<line x1="21" x2="14" y1="4" y2="4"></line><line x1="10" x2="3" y1="4" y2="4"></line><line x1="21" x2="12" y1="12" y2="12"></line><line x1="8" x2="3" y1="12" y2="12"></line><line x1="21" x2="16" y1="20" y2="20"></line><line x1="12" x2="3" y1="20" y2="20"></line><line x1="14" x2="14" y1="2" y2="6"></line><line x1="8" x2="8" y1="10" y2="14"></line><line x1="16" x2="16" y1="18" y2="22"></line>',
  Guide:
    '<path d="M12 7v14"></path><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path>',
};

export const SEARCH_ICON_SVG = '<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>';

/** Lucide's <svg> wrapper (stroke 2, round caps). */
export function lucideSvg(inner: string, className: string, size = 24) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}" aria-hidden="true">${inner}</svg>`;
}

/** A search icon on phones and tablets; a search-bar-shaped button from lg up.
 * On tablets the bar took the room the menu links needed, so the last one
 * was cut off. */
export const SEARCH_BUTTON_CLASS =
  "flex size-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground lg:h-8 lg:w-60 lg:justify-start lg:rounded-md lg:border lg:bg-background lg:px-2.5 lg:shadow-xs";
export const SEARCH_ICON_CLASS = "size-4 shrink-0 max-lg:text-foreground";
export const SEARCH_LABEL_CLASS = "truncate max-lg:hidden";
/** The ⌘K / Ctrl K hint: Kbd's own look (ui/kbd.tsx) plus where it sits. */
export const SEARCH_KBD_CLASS = "ml-auto hidden lg:inline-flex";
export const SEARCH_KBD_FULL_CLASS =
  "pointer-events-none h-5 min-w-5 select-none items-center justify-center gap-1 rounded-sm bg-muted px-1 font-sans text-xs font-medium text-muted-foreground ml-auto hidden lg:inline-flex";

/** The notices bell (spectrumui/notification-bell.tsx at size "sm", as the
 * header uses it: no border or background until hovered). */
export const BELL_DOME_PATH = "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9";
export const BELL_CLAPPER_PATH = "M10.3 21a1.94 1.94 0 0 0 3.4 0";
export const BELL_BUTTON_CLASS =
  "relative inline-flex size-9 items-center justify-center rounded-full border border-transparent bg-transparent text-foreground";
export const BELL_ICON_SIZE = 16;
/** Counts above this show as "9+". */
export const BELL_MAX = 9;
export const BELL_BADGE_CLASS =
  "absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-background";
export const BELL_BADGE_COUNT_CLASS = "relative inline-flex overflow-hidden tabular-nums";

export function bellBadgeText(count: number) {
  return count > BELL_MAX ? `${BELL_MAX}+` : String(count);
}

/** The avatar circle, the same 28px as Clerk's own avatar button. */
export const AVATAR_BOX_CLASS =
  "flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-medium text-muted-foreground uppercase";
export const AVATAR_IMAGE_CLASS = "size-full object-cover";

/** Clerk's image servers (the ones its avatar asks for sized copies from). */
export const CLERK_IMAGE_URL = /^https:\/\/img\.(clerk\.com|clerkstage\.dev|lclclerk\.com)\/[^\s"'<>\\]*$/;

/** Only Clerk's own image links are drawn from a remembered cookie. */
export function isClerkImageUrl(url: string | null | undefined): url is string {
  return typeof url === "string" && url.length <= 2048 && CLERK_IMAGE_URL.test(url);
}

/**
 * The same image request Clerk's avatar button makes (Clerk asks its image
 * server for 80px and 160px copies), so the browser already has the picture
 * when Clerk's button replaces the placeholder and it shows at once.
 */
export function clerkAvatarSources(url: string): { src: string; srcSet?: string } {
  if (!isClerkImageUrl(url)) return { src: url };
  const sized = (width: number) => {
    const next = new URL(url);
    next.searchParams.append("width", String(width));
    return next.href;
  };
  return { src: sized(160), srcSet: `${sized(80)} 1x,${sized(160)} 2x` };
}
