/** Cookie that stores how many rows a list last showed. */
export function rememberedRowsCookie(key: string) {
  return `bs-rows-${key}`;
}

/** Category chips last shown on Notices. */
export const NOTICE_CATS_COOKIE = "bs-notice-cats";

/** Writes a cookie from the browser. Kept out of components so the render rules stay happy. */
export function writeClientCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; Path=/; Max-Age=2592000; SameSite=Lax`;
}
