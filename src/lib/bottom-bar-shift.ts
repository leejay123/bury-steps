/**
 * How far the phone bottom bar has to move down to sit on the bottom of the
 * screen again.
 *
 * iOS (Home Screen apps especially) can keep the page's fixed layer short
 * after the keyboard closes, so `bottom: 0` lands where the top of the
 * keyboard was and the page scrolls on underneath the bar. The visible area
 * (visualViewport.height) is back to full height by then, so the gap between
 * the two is how far the bar is stuck up.
 *
 * `anchor` is where `bottom: 0` lands, from the top of the window. The
 * visual viewport's offsetTop is ignored on purpose: iOS 26 can leave a stale
 * one behind after the keyboard closes (WebKit bug 297779), which would push
 * the bar off the bottom instead.
 */
export function bottomBarShift({
  anchor,
  visibleHeight,
  scale,
}: {
  anchor: number;
  visibleHeight: number;
  scale: number;
}) {
  // Pinch-zoomed in: the visible area is smaller than the page on purpose.
  if (Math.abs(scale - 1) > 0.01) return 0;
  const gap = Math.round(visibleHeight - anchor);
  // Sub-pixel rounding and the address bar settling aren't worth a move.
  return gap > 2 ? gap : 0;
}
