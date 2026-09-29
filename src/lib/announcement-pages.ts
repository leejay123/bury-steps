/**
 * Where the announcement bar shows (Settings → Site behaviour). Stored as
 * one string on SiteSetting.announcementPages:
 *   "all"    — every page
 *   "home"   — the homepage only
 *   "public" — everywhere except the organiser area (/admin)
 *   "/walks,/notices" — just those pages (and pages under them)
 */
export type AnnouncementScope = "all" | "home" | "public" | "pages";

export function announcementScope(pages: string): AnnouncementScope {
  if (pages === "home" || pages === "public") return pages;
  return pages.startsWith("/") ? "pages" : "all";
}

/** The chosen paths for "pages", cleaned: leading slash, no trailing one, no repeats. */
export function announcementPaths(pages: string): string[] {
  if (!pages.startsWith("/")) return [];
  return [...new Set(pages.split(",").map(cleanPath).filter((path): path is string => path !== null))];
}

function cleanPath(raw: string): string | null {
  const path = raw.trim();
  if (!path) return null;
  const withSlash = path.startsWith("/") ? path : `/${path}`;
  if (withSlash.startsWith("//") || /\s/.test(withSlash)) return null;
  return withSlash.length > 1 ? withSlash.replace(/\/+$/, "") : withSlash;
}

/**
 * Turns the settings form's choice into the stored string, or null if the
 * page list is unusable. `list` is what the organiser typed for "pages".
 */
export function serializeAnnouncementPages(scope: string, list: string): string | null {
  if (scope === "all" || scope === "home" || scope === "public") return scope;
  if (scope !== "pages") return null;
  const raw = list.split(",").map((part) => part.trim()).filter(Boolean);
  const paths = raw.map(cleanPath);
  if (paths.length === 0 || paths.some((path) => path === null)) return null;
  return [...new Set(paths as string[])].join(",");
}

/**
 * Does the bar belong on `pathname`? Kept tiny and self-contained because
 * the same logic is also inlined (see ANNOUNCEMENT_MATCH_JS) into the
 * script that hides the bar before the page is drawn.
 */
export function announcementShowsOn(pages: string, pathname: string): boolean {
  if (pages === "home") return pathname === "/";
  if (pages === "public") return !/^\/admin(\/|$)/.test(pathname);
  if (!pages.startsWith("/")) return true;
  return pages.split(",").some((path) => pathname === path || (path !== "/" && pathname.startsWith(`${path}/`)));
}

/** announcementShowsOn as plain JS, for the inline pre-paint script. */
export const ANNOUNCEMENT_MATCH_JS = `function(r,p){if(r==="home")return p==="/";if(r==="public")return!/^\\/admin(\\/|$)/.test(p);if(r.charAt(0)!=="/")return true;return r.split(",").some(function(x){return p===x||(x!=="/"&&p.indexOf(x+"/")===0)})}`;
