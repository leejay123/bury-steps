/**
 * Temporary owner tool (Settings → Site behaviour): while this cookie is
 * set in a browser, pages there show their loading placeholder — held for
 * a few seconds before the content ("hold"), or instead of it ("always") —
 * so the placeholders can be looked at. Only the browser it was turned on
 * in is affected.
 */
export const PLACEHOLDER_PREVIEW_COOKIE = "bs-preview-placeholders";

export type PlaceholderPreviewMode = "hold" | "always";

/** How long "hold" keeps a page's placeholder up. */
export const PLACEHOLDER_HOLD_MS = 5000;

export function parsePlaceholderPreview(value: string | undefined | null): PlaceholderPreviewMode | null {
  return value === "hold" || value === "always" ? value : null;
}

export function readPlaceholderPreview(): PlaceholderPreviewMode | null {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${PLACEHOLDER_PREVIEW_COOKIE}=([^;]*)`));
    return parsePlaceholderPreview(match?.[1]);
  } catch {
    return null;
  }
}

export function setPlaceholderPreview(mode: PlaceholderPreviewMode | null) {
  document.cookie = mode
    ? `${PLACEHOLDER_PREVIEW_COOKIE}=${mode}; Path=/; Max-Age=86400; SameSite=Lax`
    : `${PLACEHOLDER_PREVIEW_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
