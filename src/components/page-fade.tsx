"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
// Not re-exported from next/navigation; the same enum Link uses for prefetch={true}.
import { PrefetchKind } from "next/dist/client/components/router-reducer/router-reducer-types";
import { animate, stagger } from "motion";
import { slideDirection, type PageTransition } from "@/lib/page-transition";

// Same feel as the returns portal's orders ↔ order detail swap
// (iblaze-returns dashboard-client.tsx: 18px, 0.22s, this curve).
const EASE = [0.25, 0.1, 0.25, 1] as const;
const DISTANCE = 18;
const DURATION = 0.22;

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
 *   "none"  — no animation
 * No View Transitions: they snapshot the page and faded through white on
 * phones. Skipped on first load (except the card cascade) and for people
 * who prefer reduced motion.
 */
export function PageFade({ children, mode = "fade" }: { children: ReactNode; mode?: PageTransition }) {
  const pathname = usePathname();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const previous = useRef<string | null>(null);
  const leaving = useRef(false);
  const fromMenu = useRef(false);

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
      if (!link || mode !== "slide" || link.closest("header, [data-slot='dialog-content'], [data-slot='popover-content']")) {
        return null;
      }
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return null;
      const direction = slideDirection(location.pathname, url.pathname);
      if (!direction || reducedMotion()) return null;
      return { direction, href: url.pathname + url.search + url.hash };
    };

    // Start loading the new page the moment it's asked for, so it arrives
    // while the old one slides out instead of only after. A full prefetch
    // (like the menu links) brings the page's actual content, not just its
    // loading skeleton; a mouse press gets it going before the click lands.
    // Next skips a prefetch it already has, so a press then a click fetches once.
    const prefetch = (href: string) => router.prefetch(href, { kind: PrefetchKind.FULL });
    const onPointerDown = (event: PointerEvent) => {
      // Not on touch: a finger landing on a card is as often the start of a
      // scroll as a tap, and each one would fetch a whole page.
      if (event.pointerType !== "mouse") return;
      const target = slideTarget(plainLink(event));
      if (target) prefetch(target.href);
    };

    const onClick = (event: MouseEvent) => {
      const link = plainLink(event);
      // Pages opened from the phone menu just appear: the menu closing is
      // already the change people see, and a slide under it looked messy.
      if (link?.closest("[data-slot='popover-content']")) {
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
      animate(el, { opacity: 0, x: -target.direction * DISTANCE }, { duration: DURATION, ease: EASE }).then(go, go);
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
    const from = previous.current;
    previous.current = pathname;
    const wasLeaving = leaving.current;
    leaving.current = false;
    const openedFromMenu = fromMenu.current;
    fromMenu.current = false;
    const el = ref.current;
    if (!el) return;

    const clear = () => {
      // A lingering transform would make this wrapper the containing block
      // for any position:fixed content inside.
      el.style.transform = "";
      el.style.opacity = "";
    };
    if (mode === "none" || openedFromMenu || reducedMotion()) {
      clear();
      return;
    }

    const runs: { complete: () => void }[] = [];
    if (mode === "slide") {
      const items = el.querySelectorAll("[data-stagger-item]");
      if (items.length) {
        runs.push(
          animate(items, { opacity: [0, 1], y: [14, 0] }, { duration: 0.28, delay: stagger(0.055), ease: EASE }),
        );
      }
    }

    if (from !== null && from !== pathname) {
      const direction = mode === "slide" ? slideDirection(from, pathname) : 0;
      const run = direction
        ? animate(
            el,
            { opacity: [wasLeaving ? 0 : 0.3, 1], x: [direction * DISTANCE, 0] },
            { duration: DURATION, ease: EASE },
          )
        : animate(el, { opacity: [0.4, 1] }, { duration: 0.18, ease: "easeOut" });
      run.then(clear, clear);
      runs.push(run);
    } else {
      clear();
    }
    // Cut short (another page change, or the setting flipped): jump to the
    // end rather than freezing half-faded.
    return () => runs.forEach((run) => run.complete());
  }, [pathname, mode]);

  return (
    <div className="flex min-w-0 flex-1 flex-col" ref={ref}>
      {children}
    </div>
  );
}
