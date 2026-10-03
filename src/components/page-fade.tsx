"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useClientPathname } from "@/components/client-pathname";
import { slideDirection, type PageTransition } from "@/lib/page-transition";

// Same feel as the returns portal's orders ↔ order detail swap
// (iblaze-returns dashboard-client.tsx: 18px, 0.22s, this curve).
const EASE = "cubic-bezier(0.25, 0.1, 0.25, 1)";
const DISTANCE = 18;
const DURATION = 0.22;

/**
 * What moves on a page change: the whole page, as one — never pieces of
 * its content separately (that made text and cards slide about on their
 * own). A page can still name a single part to move instead with
 * data-page-motion (the contact card).
 */
function moving(page: HTMLElement): HTMLElement[] {
  // Pages kept in the background (Next.js holds the last page hidden so Back
  // is instant) are still inside this wrapper: only pick what's on screen.
  const marked = [...page.querySelectorAll<HTMLElement>("[data-page-motion]")].filter(
    (node) => node.getClientRects().length > 0,
  );
  return marked.length ? marked : [page];
}

type Run = { complete: () => void; cancel: () => void };

/**
 * Plays an entrance or exit with the browser's own animations (Web
 * Animations API). They never write into the element's style, so nothing
 * can be left behind: when one ends — or is cut short because Next hid the
 * page in the background or swapped content in — the element is simply back
 * to normal. (Motion's animate() kept the end values as inline styles, and
 * an interrupted run left whole pages faded.)
 */
function play(
  nodes: HTMLElement[],
  from: { opacity?: number; x?: number; y?: number; blur?: number },
  to: { opacity?: number; x?: number; y?: number; blur?: number },
  options: { duration: number; easing?: string; delay?: (index: number) => number; hold?: boolean },
): Run {
  const frame = (f: { opacity?: number; x?: number; y?: number; blur?: number }) => ({
    opacity: f.opacity ?? 1,
    transform: `translate(${f.x ?? 0}px, ${f.y ?? 0}px)`,
    filter: `blur(${f.blur ?? 0}px)`,
  });
  const animations = nodes.map((node, index) =>
    node.animate([frame(from), frame(to)], {
      duration: options.duration * 1000,
      easing: options.easing ?? EASE,
      delay: options.delay ? options.delay(index) * 1000 : 0,
      // Entrances show their first frame while waiting their turn, then let
      // go entirely; an exit holds its last frame until it's cancelled.
      fill: options.hold ? "forwards" : "backwards",
    }),
  );
  return {
    complete: () => animations.forEach((animation) => animation.finish()),
    cancel: () => animations.forEach((animation) => animation.cancel()),
  };
}

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Animates the page content when the page changes (Settings → Site
 * behaviour → Page transitions):
 *   "fade"  — a quick fade-in
 *   "slide" — like the returns portal: going deeper (opening a walk, a
 *             notice, a settings page…), the current page slides left and
 *             fades out, then the new one slides in from the right; coming
 *             back, it slides out to the right and the list slides in from
 *             the left. Out first, then in (Motion's AnimatePresence
 *             mode="wait", done across real page changes so every page keeps
 *             its own shareable address). The whole page moves as one;
 *             nothing inside it slides on its own. Sideways moves just fade.
 *   "reveal" — every page fades in from a soft 2px blur, in place, like the
 *             Members list's skeleton reveal — on every visit
 *   "rise"  — every page rises 14px into place as it fades in, like the
 *             walk cards (which still cascade)
 *   "none"  — no animation
 * No View Transitions: they snapshot the page and faded through white on
 * phones. Skipped on first load (except the card cascade) and for people
 * who prefer reduced motion.
 */
export function PageFade({ children, mode = "fade" }: { children: ReactNode; mode?: PageTransition }) {
  // null until known in the browser (see client-pathname.tsx).
  const pathname = useClientPathname();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const previous = useRef<string | null>(null);
  const leaving = useRef(false);
  const fromMenu = useRef(false);
  // The slide-out, which holds the old page out of sight until the new one
  // shows — cancelled then, so a page kept for Back is never left hidden.
  const slideOutRun = useRef<Run | null>(null);
  // Set when a bottom bar tab is tapped: which way to slide (+1 = the tab
  // is to the right of the current one), or 0 when it's not a tab tap.
  const fromBottomBar = useRef<-1 | 0 | 1>(0);

  // Notes how a page change was started (bottom-bar tab, phone menu) so the
  // new page comes in the right way.
  useEffect(() => {
    // The in-app link a plain press or click lands on, if any.
    const plainLink = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return null;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return null;
      if ((link.target && link.target !== "_self") || link.hasAttribute("download")) return null;
      return link;
    };
    const onClick = (event: MouseEvent) => {
      const link = plainLink(event);
      const bar = link?.closest("[data-bottom-nav]");
      if (bar && link) {
        // Like an app's tab bar: slide towards the tapped tab, worked out
        // from the tabs' order in the bar (not the menu's sections — Contact
        // Us isn't one, so it used to rise instead of slide).
        const tabs = [...bar.querySelectorAll("a[href], button")];
        const current = tabs.findIndex((tab) => tab.getAttribute("aria-current") === "page");
        const tapped = tabs.indexOf(link);
        fromBottomBar.current = current === -1 || tapped > current ? 1 : -1;
      } else {
        fromBottomBar.current = 0;
      }
      // Pages opened from the phone menu just appear: the menu closing is
      // already the change people see, and a slide under it looked messy.
      if (link?.closest("[data-slot='popover-content'], [data-bottom-nav-sheet]")) {
        fromMenu.current = true;
        return;
      }
      // No slide-out: the current page stays where it is until the next
      // one is ready, then that one slides in. Sliding this one out first
      // left a blank page for as long as the next one took to arrive.
    };
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
    };
  }, [mode, router]);

  // Then in, once the new page is showing.
  useEffect(() => {
    if (pathname === null) return;
    const from = previous.current;
    previous.current = pathname;
    const wasLeaving = leaving.current;
    leaving.current = false;
    const openedFromMenu = fromMenu.current;
    fromMenu.current = false;
    const barDirection = fromBottomBar.current;
    fromBottomBar.current = 0;
    const page = ref.current;
    if (!page) return;
    // A page the slide-out moved may be shown again as it was (Back
    // restores the previous page) — never leave it faded or shifted.
    slideOutRun.current?.cancel();
    slideOutRun.current = null;
    const el = moving(page);

    const clear = () => {
      // A lingering transform would make this wrapper the containing block
      // for any position:fixed content inside.
      for (const node of new Set([page, ...el])) {
        node.style.transform = "";
        node.style.opacity = "";
      }
    };
    // The homepage just appears — no slide, fade or card cascade — so its
    // hero is simply there when you come back.
    if (mode === "none" || openedFromMenu || pathname === "/" || reducedMotion()) {
      clear();
      return;
    }

    // Bottom bar tabs are like switching tabs in an app: the page and its
    // cards slide in sideways, towards the tab you tapped, whichever page
    // transition is chosen (with Rise up, the first tap rose instead and
    // looked wrong next to the sliding tab pill).
    const tabSwitch = barDirection !== 0 && from !== null;
    const direction = tabSwitch ? barDirection : mode === "slide" && from !== null ? slideDirection(from, pathname) : 0;
    const cardsSideways = tabSwitch;
    const runs: Run[] = [];
    let watcher: MutationObserver | null = null;
    if (mode === "rise" && !tabSwitch) {
      // Cascade the list rows in. Some lists (Members, Messages…) load a
      // moment after the page shows, behind skeleton rows, so keep watching
      // briefly and cascade rows that arrive late too. Each row only once.
      const cascade = () => {
        const fresh = [...page.querySelectorAll<HTMLElement>("[data-stagger-item]:not([data-staggered])")];
        if (!fresh.length) return;
        for (const item of fresh) item.dataset.staggered = "";
        runs.push(
          play(fresh, cardsSideways ? { opacity: 0, x: direction * DISTANCE } : { opacity: 0, y: 14 }, {}, {
            duration: 0.28,
            delay: (index) => index * 0.055,
          }),
        );
      };
      cascade();
      watcher = new MutationObserver(cascade);
      watcher.observe(page, { childList: true, subtree: true });
      window.setTimeout(() => watcher?.disconnect(), 2500);
    }

    // How content comes in on this page change (also used for content that
    // arrives a moment later — see below).
    const enter = (nodes: HTMLElement[], fromHidden: boolean) =>
      cardsSideways
        ? play(nodes, { opacity: 0.3, x: direction * DISTANCE }, {}, { duration: DURATION })
        : mode === "rise"
        ? // Like the walk cards: rise 14px into place while fading in.
          play(nodes, { opacity: 0, y: 14 }, {}, { duration: 0.28 })
        : mode === "reveal"
        ? // Like the Members list's SkeletonReveal: fade in from a soft blur,
          // in place — every time, even when the page was ready instantly.
          play(nodes, { opacity: 0, blur: 2 }, {}, { duration: 0.4, easing: "ease-in-out" })
        : direction
        ? play(nodes, { opacity: fromHidden ? 0 : 0.3, x: direction * DISTANCE }, {}, { duration: DURATION })
        : play(nodes, { opacity: 0.4 }, {}, { duration: 0.18, easing: "ease-out" });

    if (from !== null && from !== pathname) {
      clear();
      // The page moves as one. If its details are still loading, the
      // placeholder moves with it and the content then appears in place.
      runs.push(enter(el, wasLeaving));
    } else {
      clear();
    }
    // Cut short (another page change, or the setting flipped): jump to the
    // end rather than freezing half-faded.
    return () => {
      watcher?.disconnect();
      runs.forEach((run) => run.complete());
    };
  }, [pathname, mode]);

  return (
    <div className="flex min-w-0 flex-1 flex-col" ref={ref}>
      {children}
    </div>
  );
}
