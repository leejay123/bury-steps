/**
 * Owner test (Settings → Site behaviour, and the Loading button next to
 * Placeholders): what a loading page shows in this browser — the loader
 * (page-loader.tsx, everyone's default) or the grey skeleton shapes. Only
 * the browser it was picked in is affected.
 */
export const LOADING_STYLE_COOKIE = "bs-loading-style";

export type LoadingStyle = "loader" | "skeletons";

export const LOADING_STYLES: { value: LoadingStyle; label: string }[] = [
  { value: "loader", label: "Loader" },
  { value: "skeletons", label: "Skeletons" },
];

/** Fired on window when it changes, so open pages switch at once. */
const LOADING_STYLE_EVENT = "bs-loading-style";

export function readLoadingStyle(): LoadingStyle {
  try {
    const value = document.cookie.match(new RegExp(`(?:^|; )${LOADING_STYLE_COOKIE}=([^;]*)`))?.[1];
    return value === "skeletons" ? "skeletons" : "loader";
  } catch {
    return "loader";
  }
}

/** globals.css shows the skeletons (and hides the loader) on html[data-loading-style="skeletons"]. */
export function applyLoadingStyle(style: LoadingStyle = readLoadingStyle()) {
  if (style === "skeletons") document.documentElement.setAttribute("data-loading-style", "skeletons");
  else document.documentElement.removeAttribute("data-loading-style");
}

export function setLoadingStyle(style: LoadingStyle) {
  document.cookie =
    style === "skeletons"
      ? `${LOADING_STYLE_COOKIE}=skeletons; Path=/; Max-Age=2592000; SameSite=Lax`
      : `${LOADING_STYLE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  applyLoadingStyle(style);
  window.dispatchEvent(new Event(LOADING_STYLE_EVENT));
}

export function subscribeLoadingStyle(onChange: () => void) {
  window.addEventListener(LOADING_STYLE_EVENT, onChange);
  return () => window.removeEventListener(LOADING_STYLE_EVENT, onChange);
}
