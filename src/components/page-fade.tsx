"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
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

  // Out first: catch clicks on links that go deeper or come back, slide the
  // current page out, then navigate. Capture phase on document runs before
  // Next's own <Link> handler, which then never sees the click.
  useEffect(() => {
    if (mode !== "slide") return;
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      if ((link.target && link.target !== "_self") || link.hasAttribute("download")) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      const direction = slideDirection(location.pathname, url.pathname);
      const el = ref.current;
      if (!direction || !el || reducedMotion() || leaving.current) return;

      event.preventDefault();
      event.stopPropagation();
      leaving.current = true;
      const href = url.pathname + url.search + url.hash;
      let gone = false;
      const go = () => {
        if (gone) return;
        gone = true;
        router.push(href);
      };
      animate(el, { opacity: 0, x: -direction * DISTANCE }, { duration: DURATION, ease: EASE }).then(go, go);
      // Safety net: never leave someone stuck if the animation can't finish
      // (a background tab pauses animations).
      window.setTimeout(go, 400);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [mode, router]);

  // Then in, once the new page is showing.
  useEffect(() => {
    const from = previous.current;
    previous.current = pathname;
    const wasLeaving = leaving.current;
    leaving.current = false;
    const el = ref.current;
    if (!el) return;

    const clear = () => {
      // A lingering transform would make this wrapper the containing block
      // for any position:fixed content inside.
      el.style.transform = "";
      el.style.opacity = "";
    };
    if (mode === "none" || reducedMotion()) {
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
