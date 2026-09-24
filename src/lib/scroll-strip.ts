/**
 * Centre `item` within its own sideways-scrolling strip (a row of filter
 * chips or tabs) without moving anything else. Use instead of
 * item.scrollIntoView({ inline: "center" }): that scrolls every scrollable
 * ancestor in turn, the page included, which made the page jump on phones.
 */
export function centerInScrollStrip(item: HTMLElement): void {
  let strip = item.parentElement;
  while (strip && strip.scrollWidth <= strip.clientWidth) strip = strip.parentElement;
  if (!strip || strip === document.body || strip === document.documentElement) return;

  const stripBox = strip.getBoundingClientRect();
  const itemBox = item.getBoundingClientRect();
  const left =
    strip.scrollLeft + (itemBox.left - stripBox.left) - (stripBox.width - itemBox.width) / 2;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  strip.scrollTo({ left: Math.max(0, left), behavior: reduceMotion ? "auto" : "smooth" });
}
