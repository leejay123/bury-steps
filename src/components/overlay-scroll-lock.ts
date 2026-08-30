/**
 * Scroll locks that set `position:fixed; top:-y` on <body> shift the sticky
 * header off-screen. Never use that pattern.
 *
 * Separately: RemoveScroll's `overflow:hidden` (data-scroll-locked) also breaks
 * `position:sticky`, so a stuck header drops back to its in-flow spot above the
 * viewport when you opened the overlay mid-scroll — it vanishes under the blur
 * and pops back on close. Pin it to its on-screen box for the open lifetime.
 *
 * Call `lockBackgroundScroll()` when an overlay opens (from a `useEffect` on
 * the controlled `open` flag, not only from `onOpenChange` — admin drawers often
 * open by setting state directly and never fire `onOpenChange(true)`).
 */

const BODY_LOCK_PROPS = ["position", "top", "left", "right", "height", "width"] as const;

type HeaderPin = {
  header: HTMLElement;
  spacer: HTMLDivElement;
  prev: {
    position: string;
    top: string;
    left: string;
    right: string;
    width: string;
    zIndex: string;
    margin: string;
  };
};

function clearBodyPositionFixedLock() {
  const { body } = document;
  if (body.style.position !== "fixed" && body.style.top === "") return;
  const top = body.style.top;
  const y = top ? Math.abs(Number.parseInt(top, 10) || 0) : window.scrollY;
  for (const prop of BODY_LOCK_PROPS) {
    body.style.removeProperty(prop);
  }
  if (y) window.scrollTo(0, y);
}

function pinSiteHeaderInPlace(): HeaderPin | null {
  const header = document.querySelector<HTMLElement>("header");
  if (!header || header.dataset.scrollLockPinned === "1") return null;

  const rect = header.getBoundingClientRect();
  const prev = {
    position: header.style.position,
    top: header.style.top,
    left: header.style.left,
    right: header.style.right,
    width: header.style.width,
    zIndex: header.style.zIndex,
    margin: header.style.margin,
  };

  const spacer = document.createElement("div");
  spacer.dataset.headerScrollLockSpacer = "1";
  spacer.setAttribute("aria-hidden", "true");
  spacer.style.height = `${Math.max(0, Math.round(rect.height))}px`;
  spacer.style.width = "100%";
  spacer.style.flexShrink = "0";
  spacer.style.pointerEvents = "none";
  header.parentElement?.insertBefore(spacer, header);

  // Stay under the blur overlay (z-60). Round so sub-pixel left does not drift.
  header.dataset.scrollLockPinned = "1";
  header.style.position = "fixed";
  header.style.top = `${Math.max(0, Math.round(rect.top))}px`;
  header.style.left = `${Math.round(rect.left)}px`;
  header.style.width = `${Math.round(rect.width)}px`;
  header.style.right = "auto";
  header.style.zIndex = "55";
  header.style.margin = "0";

  return { header, spacer, prev };
}

function unpinSiteHeader(pin: HeaderPin | null) {
  if (!pin) return;
  const { header, spacer, prev } = pin;
  if (spacer.isConnected) spacer.remove();
  header.style.position = prev.position;
  header.style.top = prev.top;
  header.style.left = prev.left;
  header.style.right = prev.right;
  header.style.width = prev.width;
  header.style.zIndex = prev.zIndex;
  header.style.margin = prev.margin;
  delete header.dataset.scrollLockPinned;
}

/** Unpin only after RemoveScroll drops overflow:hidden — otherwise sticky breaks again. */
function unpinSiteHeaderWhenScrollUnlocks(pin: HeaderPin | null) {
  if (!pin) return;
  let tries = 0;
  const tick = () => {
    if (!document.body.hasAttribute("data-scroll-locked") || tries++ > 60) {
      unpinSiteHeader(pin);
      return;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function eventTargetInsideOpenOverlay(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      '[data-slot="drawer-content"], [data-slot="dialog-content"], [data-slot="alert-dialog-content"]',
    ),
  );
}

/** Pin the site header and block background scroll for the lifetime of an overlay. */
export function lockBackgroundScroll() {
  // Pin while sticky is still active (before overflow:hidden lands).
  const headerPin = pinSiteHeaderInPlace();

  const onTouchMove = (event: TouchEvent) => {
    if (eventTargetInsideOpenOverlay(event.target)) return;
    event.preventDefault();
  };
  const onWheel = (event: WheelEvent) => {
    if (eventTargetInsideOpenOverlay(event.target)) return;
    event.preventDefault();
  };

  document.addEventListener("touchmove", onTouchMove, { capture: true, passive: false });
  document.addEventListener("wheel", onWheel, { capture: true, passive: false });
  clearBodyPositionFixedLock();
  const observer = new MutationObserver(() => {
    clearBodyPositionFixedLock();
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ["style"] });

  return () => {
    document.removeEventListener("touchmove", onTouchMove, true);
    document.removeEventListener("wheel", onWheel, true);
    observer.disconnect();
    clearBodyPositionFixedLock();
    unpinSiteHeaderWhenScrollUnlocks(headerPin);
  };
}
