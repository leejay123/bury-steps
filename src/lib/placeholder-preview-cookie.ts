/**
 * Temporary owner tool (Settings → Site behaviour): while this cookie is
 * "1" in a browser, pages there show their loading placeholder in place of
 * their content, so the placeholders can be looked at. It only affects the
 * browser it was turned on in.
 */
export const PLACEHOLDER_PREVIEW_COOKIE = "bs-preview-placeholders";

export function readPlaceholderPreview(): boolean {
  try {
    return new RegExp(`(?:^|; )${PLACEHOLDER_PREVIEW_COOKIE}=1(?:;|$)`).test(document.cookie);
  } catch {
    return false;
  }
}

export function setPlaceholderPreview(on: boolean) {
  document.cookie = on
    ? `${PLACEHOLDER_PREVIEW_COOKIE}=1; Path=/; Max-Age=86400; SameSite=Lax`
    : `${PLACEHOLDER_PREVIEW_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
