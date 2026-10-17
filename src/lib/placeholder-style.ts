/**
 * Temporary owner test (Settings → Site behaviour, and the Placeholders
 * pill): which look the loading placeholders use in this browser — the
 * site's own grey shapes, shimmer-from-structure's shimmer blocks
 * (shimmer-test.tsx), AutoSkeleton's ready-made shapes
 * (autoskeleton-test.tsx), or Boneyard's bones drawn from our shapes
 * (boneyard-test.tsx), or Skeleton Mammoth's CSS skeleton on our shapes
 * (mammoth-test.tsx). Only the browser it was picked in is affected.
 */
export const PLACEHOLDER_STYLE_COOKIE = "bs-placeholder-style";

export type PlaceholderStyle = "grey" | "shimmer" | "autoskeleton" | "boneyard" | "mammoth";

/** The Style button's order, and its labels. */
export const PLACEHOLDER_STYLES: { value: PlaceholderStyle; label: string }[] = [
  { value: "grey", label: "Grey" },
  { value: "shimmer", label: "Shimmer" },
  { value: "autoskeleton", label: "AutoSkeleton" },
  { value: "boneyard", label: "Boneyard" },
  { value: "mammoth", label: "Mammoth" },
];

/** Fired on window when the style changes, so open pages switch at once. */
export const PLACEHOLDER_STYLE_EVENT = "bs-placeholder-style";

export function readPlaceholderStyle(): PlaceholderStyle {
  try {
    const value = document.cookie.match(new RegExp(`(?:^|; )${PLACEHOLDER_STYLE_COOKIE}=([^;]*)`))?.[1];
    return value === "shimmer" || value === "autoskeleton" || value === "boneyard" || value === "mammoth"
      ? value
      : "grey";
  } catch {
    return "grey";
  }
}

export function setPlaceholderStyle(style: PlaceholderStyle) {
  document.cookie =
    style !== "grey"
      ? `${PLACEHOLDER_STYLE_COOKIE}=${style}; Path=/; Max-Age=2592000; SameSite=Lax`
      : `${PLACEHOLDER_STYLE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  window.dispatchEvent(new Event(PLACEHOLDER_STYLE_EVENT));
}

export function subscribePlaceholderStyle(onChange: () => void) {
  window.addEventListener(PLACEHOLDER_STYLE_EVENT, onChange);
  return () => window.removeEventListener(PLACEHOLDER_STYLE_EVENT, onChange);
}
