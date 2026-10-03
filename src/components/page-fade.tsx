"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useClientPathname } from "@/components/client-pathname";
import { animate, stagger } from "motion";
import { slideDirection, type PageTransition } from "@/lib/page-transition";

// Same feel as the returns portal's orders ↔ order detail swap
// (iblaze-returns dashboard-client.tsx: 18px, 0.22s, this curve).
const EASE = [0.25, 0.1, 0.25, 1] as const;
const DISTANCE = 18;
const DURATION = 0.22;

/**
 * What moves on a page change: only the content, never the page's heading.
 * A page can name its moving parts with data-page-motion (the contact
 * card); otherwise it's everything after the heading block (the <h1> and
 * the lines beside it), and pages without an <h1> move as a whole.
 */
function moving(page: HTMLElement): HTMLElement[] {
  const marked = [...page.querySelectorAll<HTMLElement>("[data-page-motion]")];
  if (marked.length) return marked;
  const heading = page.querySelector("h1")?.parentElement;
  if (!heading || heading === page || !page.contains(heading)) return [page];
  const parts: HTMLElement[] = [];
  // Everything after the heading block, at each level up to the page.
  for (let node: HTMLElement | null = heading; node && node !== page; node = node.parentElement) {
    for (let next = node.nextElementSibling; next; next = next.nextElementSibling) {
      // Divider lines drawn under the heading stay with it.
      if (next instanceof HTMLElement && getComputedStyle(next).position !== "absolute") parts.push(next);
    }
  }
  return parts.length ? parts : [page];
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
      if (!direction || reducedMotion()) return null;
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
      prefetch(target.href);
      let gone = false;
      const go = () => {
        if (gone) return;
        gone = true;
        router.push(target.href);
      };
      animate(moving(el), { opacity: 0, x: -target.direction * DISTANCE }, { duration: DURATION, ease: EASE }).then(go, go);
      // Safety net: never leave someone stuck if the animation can't finish
      // (a background tab pauses animations).
      window.setTimeout(go, 400);
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
    const runs: { complete: () => void }[] = [];
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
          animate(
            fresh,
            cardsSideways ? { opacity: [0, 1], x: [direction * DISTANCE, 0] } : { opacity: [0, 1], y: [14, 0] },
            { duration: 0.28, delay: stagger(0.055), ease: EASE },
          ),
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
        ? animate(nodes, { opacity: [0.3, 1], x: [direction * DISTANCE, 0] }, { duration: DURATION, ease: EASE })
        : mode === "rise"
        ? // Like the walk cards: rise 14px into place while fading in.
          animate(nodes, { opacity: [0, 1], y: [14, 0] }, { duration: 0.28, ease: EASE })
        : direction
        ? animate(
            nodes,
            { opacity: [fromHidden ? 0 : 0.3, 1], x: [direction * DISTANCE, 0] },
            { duration: DURATION, ease: EASE },
          )
        : animate(nodes, { opacity: [0.4, 1] }, { duration: 0.18, ease: "easeOut" });

    let arrivals: MutationObserver | null = null;
    if (from !== null && from !== pathname) {
      const run = enter(el, wasLeaving);
      run.then(clear, clear);
      runs.push(run);

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
        const late = enter(outer, true);
        const reset = () => {
          for (const node of outer) {
            node.style.transform = "";
            node.style.opacity = "";
          }
        };
        late.then(reset, reset);
        runs.push(late);
      });
      arrivals.observe(page, { childList: true, subtree: true });
      window.setTimeout(() => arrivals?.disconnect(), 1500);
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
