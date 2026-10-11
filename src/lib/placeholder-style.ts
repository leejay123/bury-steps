/**
 * Temporary owner test (Settings → Site behaviour, and the Placeholders
 * pill): which look the loading placeholders use in this browser — the
 * site's own grey shapes, or shimmer-from-structure's shimmer blocks
 * (shimmer-test.tsx). Only the browser it was picked in is affected.
 */
export const PLACEHOLDER_STYLE_COOKIE = "bs-placeholder-style";

export type PlaceholderStyle = "grey" | "shimmer";

/** Fired on window when the style changes, so open pages switch at once. */
export const PLACEHOLDER_STYLE_EVENT = "bs-placeholder-style";

export function readPlaceholderStyle(): PlaceholderStyle {
  try {
    return new RegExp(`(?:^|; )${PLACEHOLDER_STYLE_COOKIE}=shimmer(?:;|$)`).test(document.cookie) ? "shimmer" : "grey";
  } catch {
    return "grey";
  }
}

export function setPlaceholderStyle(style: PlaceholderStyle) {
  document.cookie =
    style === "shimmer"
      ? `${PLACEHOLDER_STYLE_COOKIE}=shimmer; Path=/; Max-Age=2592000; SameSite=Lax`
      : `${PLACEHOLDER_STYLE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  window.dispatchEvent(new Event(PLACEHOLDER_STYLE_EVENT));
}

export function subscribePlaceholderStyle(onChange: () => void) {
  window.addEventListener(PLACEHOLDER_STYLE_EVENT, onChange);
  return () => window.removeEventListener(PLACEHOLDER_STYLE_EVENT, onChange);
}
