/**
 * The dashboard view (a test, alongside the normal site): when someone
 * presses Dashboard, every page shows inside the dashboard frame (side menu
 * and top bar) instead of the site's header and footer. The pages themselves
 * are the same; only the frame changes. Remembered in this browser, and set
 * on <html data-view="dashboard"> before the first paint (layout.tsx) so a
 * refresh doesn't flash the normal header.
 */
export const DASHBOARD_VIEW_KEY = "bs-view";

/** Runs before the page paints: dashboard view only for someone signed in (their menu cookie). */
// Not in the shadcn.io design, whose frame is already Efferd's app shell for signed-in people.
export const DASHBOARD_VIEW_SCRIPT = `try{if(document.documentElement.getAttribute("data-design")!=="shadcnio"&&localStorage.getItem("${DASHBOARD_VIEW_KEY}")==="dashboard"&&document.cookie.indexOf("bs-nav=")!==-1)document.documentElement.setAttribute("data-view","dashboard")}catch(e){}`;

export function enterDashboardView() {
  try {
    localStorage.setItem(DASHBOARD_VIEW_KEY, "dashboard");
  } catch {}
  document.documentElement.setAttribute("data-view", "dashboard");
}

export function leaveDashboardView() {
  try {
    localStorage.removeItem(DASHBOARD_VIEW_KEY);
  } catch {}
  document.documentElement.removeAttribute("data-view");
}
