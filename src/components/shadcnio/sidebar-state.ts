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
export const SIDEBAR_SCRIPT = `try{var d=document.documentElement;if(/(?:^|; )(?:${SIGNED_IN_COOKIE}=1|bs-nav=[^;])/.test(document.cookie))d.setAttribute("data-remembered-in","");if(localStorage.getItem("${SIDEBAR_KEY}")==="collapsed")d.setAttribute("data-docs-sidebar","collapsed")}catch(e){}`;
