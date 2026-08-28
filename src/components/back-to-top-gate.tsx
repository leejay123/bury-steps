import { getSiteTheme } from "@/lib/site-theme";
import { BackToTop } from "@/components/back-to-top";

/**
 * Split out from the root layout so the theme lookup for one small floating
 * button can't hold up the very first byte of every page on the site. The
 * root layout used to `await getSiteTheme()` directly, with no Suspense
 * boundary around it — since a layout's own top-level await blocks Next
 * from streaming *anything* (not even the `<html>` shell, let alone a page's
 * own `loading.tsx` skeleton) until it resolves, a slow or cold-cache
 * request here meant every visitor saw a blank white tab instead of any
 * loading state, on every single page, until this one query finished.
 */
export async function BackToTopGate() {
  const theme = await getSiteTheme();
  return theme.scrollToTopEnabled ? <BackToTop /> : null;
}
