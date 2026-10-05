/** Cookie that stores how many rows a list last showed. */
export function rememberedRowsCookie(key: string) {
  return `bs-rows-${key}`;
}

/** Category chips last shown on Notices. */
export const NOTICE_CATS_COOKIE = "bs-notice-cats";

/** Exact Progress card copy, so the placeholder wraps to the same height. */
export const CUP_TITLE_COOKIE = "bs-cup-title";
export const CUP_BODY_COOKIE = "bs-cup-body";
export const TOGETHER_BODY_COOKIE = "bs-together-body";

/** Message previews last shown, one per row, so each row is only as tall as its text. */
export const MESSAGE_LINES_COOKIE = "bs-msg-lines";

/** Writes a cookie from the browser. Kept out of components so the render rules stay happy. */
export function writeClientCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; Path=/; Max-Age=2592000; SameSite=Lax`;
}
