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
 * What moves on a page change: only the content, never the page's heading.
 * A page can name its moving parts with data-page-motion (the contact
 * card); otherwise it's everything after the heading block (the <h1> and
 * the lines beside it), and pages without an <h1> move as a whole.
 */
function moving(page: HTMLElement): HTMLElement[] {
  // Pages kept in the background (Next.js holds the last page hidden so Back
  // is instant) are still inside this wrapper: only ever pick what's on
  // screen, or the hidden page gets slid out and comes back invisible.
  const shown = (node: Element) => node.getClientRects().length > 0;
  const marked = [...page.querySelectorAll<HTMLElement>("[data-page-motion]")].filter(shown);
  if (marked.length) return marked;
  const heading = [...page.querySelectorAll("h1")].find(shown)?.parentElement;
  if (!heading || heading === page || !page.contains(heading)) return [page];
  const parts: HTMLElement[] = [];
  // Everything after the heading block, at each level up to the page.
  for (let node: HTMLElement | null = heading; node && node !== page; node = node.parentElement) {
    for (let next = node.nextElementSibling; next; next = next.nextElementSibling) {
      // Divider lines drawn under the heading stay with it.
      if (next instanceof HTMLElement && shown(next) && getComputedStyle(next).position !== "absolute") parts.push(next);
    }
  }
  return parts.length ? parts : [page];
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
  from: { opacity?: number; x?: number; y?: number },
  to: { opacity?: number; x?: number; y?: number },
  options: { duration: number; easing?: string; delay?: (index: number) => number; hold?: boolean },
): Run {
  const frame = (f: { opacity?: number; x?: number; y?: number }) => ({
    opacity: f.opacity ?? 1,
    transform: `translate(${f.x ?? 0}px, ${f.y ?? 0}px)`,
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
 *             its own shareable address). Cards marked data-stagger-item
 *             cascade in. Sideways moves just fade.
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

  // Out first: catch clicks on links that go deeper or come back, slide the
  // current page out, then navigate. Capture phase on document runs before
  // Next's own <Link> handler, which then never sees the click.
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
    // Where that link slides to, or null when it's left to Next's own <Link>.
    const slideTarget = (link: HTMLAnchorElement | null) => {
      // Header, dialogs and the phone menu handle their own clicks (desktop
      // nav starts navigating on press) — leave them alone.
      if (!link || mode !== "slide" || link.closest("header, [data-bottom-nav], [data-slot='dialog-content'], [data-slot='popover-content']")) {
        return null;
      }
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return null;
      // The homepage never slides: it should just be there.
      if (url.pathname === "/") return null;
      const direction = slideDirection(location.pathname, url.pathname);
      // Going back (← All notices, ← All members…) doesn't slide the page
      // out — the list just slides back in, like ← All settings.
      if (!direction || direction < 0 || reducedMotion()) return null;
      return { direction, href: url.pathname + url.search + url.hash };
    };

    // Start loading the new page the moment it's asked for, so it arrives
    // while the old one slides out instead of only after. Next's standard,
    // documented prefetch — it skips one it already has, so a press then a
    // click fetches once.
    const prefetch = (href: string) => router.prefetch(href);
    const onPointerDown = (event: PointerEvent) => {
      // Not on touch: a finger landing on a card is as often the start of a
      // scroll as a tap, and each one would fetch a whole page.
      if (event.pointerType !== "mouse") return;
      const target = slideTarget(plainLink(event));
      if (target) prefetch(target.href);
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
      const target = slideTarget(link);
      const el = ref.current;
      if (!target || !el || leaving.current) return;

      event.preventDefault();
      event.stopPropagation();
      leaving.current = true;
      // Ask for the new page straight away, while this one slides out:
      // the wait for it overlaps the slide instead of following it. Next
      // keeps this page on screen until the new one is ready, so it's
      // still out first, then in — just without a gap in the middle.
      slideOutRun.current?.cancel();
      slideOutRun.current = play(moving(el), {}, { opacity: 0, x: -target.direction * DISTANCE }, { duration: DURATION, hold: true });
      router.push(target.href);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
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
    if (mode === "slide" || mode === "rise") {
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
        : direction
        ? play(nodes, { opacity: fromHidden ? 0 : 0.3, x: direction * DISTANCE }, {}, { duration: DURATION })
        : play(nodes, { opacity: 0.4 }, {}, { duration: 0.18, easing: "ease-out" });

    let arrivals: MutationObserver | null = null;
    if (from !== null && from !== pathname) {
      // Still a grey placeholder (the page's own details are loading)?
      // Don't animate that — the real content gets the one entrance when it
      // arrives (below). Animating both looked like a stutter.
      const placeholder = el.some(
        (node) => node.matches('[aria-busy="true"], [data-slot="skeleton"]') || !!node.querySelector('[aria-busy="true"], [data-slot="skeleton"]'),
      );
      if (placeholder) {
        clear();
      } else {
        clear();
        runs.push(enter(el, wasLeaving));
      }

      // Pages that show your own details (Notices, Walks, Members…) open
      // with a placeholder and swap in the real list a moment later. That
      // list arrives after the animation above has run on the placeholder,
      // so give whatever arrives in the next moment the same entrance.
      arrivals = new MutationObserver((records) => {
        const added = new Set<HTMLElement>();
        for (const record of records) {
          for (const node of record.addedNodes) {
            if (!(node instanceof HTMLElement) || node.matches("script, style, template")) continue;
            if (getComputedStyle(node).position === "absolute" || getComputedStyle(node).position === "fixed") continue;
            added.add(node);
          }
        }
        // Only the outermost new parts; their insides move with them.
        const outer = [...added].filter((node) => ![...added].some((other) => other !== node && other.contains(node)));
        if (!outer.length) return;
        runs.push(enter(outer, true));
      });
      arrivals.observe(page, { childList: true, subtree: true });
      // Up to 3s: long enough for a slow phone connection, short enough not
      // to animate something that changes later for another reason.
      window.setTimeout(() => arrivals?.disconnect(), 3000);
    } else {
      clear();
    }
    // Cut short (another page change, or the setting flipped): jump to the
    // end rather than freezing half-faded.
    return () => {
      watcher?.disconnect();
      arrivals?.disconnect();
      runs.forEach((run) => run.complete());
    };
  }, [pathname, mode]);

  return (
    <div className="flex min-w-0 flex-1 flex-col" ref={ref}>
      {children}
    </div>
  );
}
