/**
 * The dashboard sidebar's state (shadcn.io's). Only signed-in members ever
 * get it: a cookie marks them, and before the first paint <html> gets
 * data-remembered-in, so the page is drawn with the sidebar from the start
 * (and never for someone signed out). On computers the header's sidebar
 * button folds it away (remembered in this browser, as
 * data-docs-sidebar="collapsed"); on phones it slides in from the left.
 * Kept out of "use client" files so the layout can put the script in the page.
 */
export const SIDEBAR_TOGGLE_EVENT = "bs-docs-sidebar-toggle";
export const SIDEBAR_KEY = "bs-docs-sidebar";
export const SIGNED_IN_COOKIE = "bs-in";
/**
 * Who's signed in, for the sidebar to be right before the first paint: their role
 * ("owner", "organiser" or "member"), name, email and photo, as JSON. Written by
 * SignedInMark; the script below turns it into html[data-sb-role] and the --me-*
 * values the sidebar's own row shows (shadcnio.css), so it never waits to load.
 */
export const ME_COOKIE = "bs-me";
export type SidebarMe = { role: "owner" | "organiser" | "member"; name: string; email: string; image: string | null };

/** Applies a SidebarMe to <html> (also run by the script below, before the first paint). */
export const APPLY_ME = `function(m){var d=document.documentElement;d.setAttribute("data-sb-role",m.role);d.style.setProperty("--me-name",JSON.stringify(String(m.name||"")));d.style.setProperty("--me-email",JSON.stringify(String(m.email||"")));if(m.image)d.style.setProperty("--me-img","url("+JSON.stringify(String(m.image))+")");else d.style.removeProperty("--me-img")}`;

/**
 * A shared walk link (/w/<token>) seen by someone signed out: the dashboard's
 * look too (html[data-guest-dash]), with a visitor's short menu and Sign in.
 */
export const GUEST_DASH_PATH = /^\/w\/[^/]+\/?$/;

/** Sets html[data-guest-dash] for this page (a new page, or someone signing in or out). */
export function syncGuestDash(path: string) {
  const d = document.documentElement;
  if (!d.hasAttribute("data-remembered-in") && GUEST_DASH_PATH.test(path)) d.setAttribute("data-guest-dash", "");
  else d.removeAttribute("data-guest-dash");
}

export const SIDEBAR_SCRIPT = `try{var d=document.documentElement;if(/(?:^|; )(?:${SIGNED_IN_COOKIE}=1|bs-nav=[^;])/.test(document.cookie))d.setAttribute("data-remembered-in","");else if(${GUEST_DASH_PATH}.test(location.pathname))d.setAttribute("data-guest-dash","");if(/(?:^|; )bs-loading-style=loader/.test(document.cookie))d.setAttribute("data-loading-style","loader");if(localStorage.getItem("${SIDEBAR_KEY}")==="collapsed")d.setAttribute("data-docs-sidebar","collapsed");var c=document.cookie.match(/(?:^|; )${ME_COOKIE}=([^;]*)/);if(c)(${APPLY_ME})(JSON.parse(decodeURIComponent(c[1])))}catch(e){}`;
