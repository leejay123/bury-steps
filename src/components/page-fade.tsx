"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { animate } from "motion";
import type { PageTransition } from "@/lib/page-transition";

/** A single walk's page — organiser (/admin/walks/<id>) or member (/w/<slug>). */
const isWalkPage = (path: string) => /^\/(admin\/walks|w)\/[^/]+$/.test(path);

/**
 * Animates the page content when the page changes (Settings → Site
 * behaviour → Page transitions):
 *   "fade"  — a quick fade-in
 *   "slide" — opening a walk slides it in from the right, leaving it slides
 *             the list back in from the left (a Motion spring); every other
 *             change fades
 *   "none"  — no animation
 * The old page stays fully on screen until the new one is ready, and the new
 * one starts part-visible (not from blank), so there's never a white gap
 * between pages. No View Transitions: they snapshot the page and faded
 * through white on phones. Skipped on first load and for people who prefer
 * reduced motion.
 */
export function PageFade({ children, mode = "fade" }: { children: ReactNode; mode?: PageTransition }) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const previous = useRef<string | null>(null);

  useEffect(() => {
    const from = previous.current;
    previous.current = pathname;
    if (from === null || from === pathname || mode === "none") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const direction =
      mode === "slide" && !isWalkPage(from) && isWalkPage(pathname)
        ? 1
        : mode === "slide" && isWalkPage(from) && !isWalkPage(pathname)
          ? -1
          : 0;

    const el = ref.current;
    if (!el) return;
    // Motion (Framer Motion): a gentle spring for the walk slide, so it
    // settles into place rather than following a fixed curve.
    const run = direction
      ? animate(
          el,
          { opacity: [0.3, 1], x: [direction * 40, 0] },
          { type: "spring", visualDuration: 0.35, bounce: 0.15 },
        )
      : animate(el, { opacity: [0.4, 1] }, { duration: 0.18, ease: "easeOut" });
    // Clear what Motion leaves inline: a lingering transform would make this
    // wrapper the containing block for any position:fixed content inside.
    const clear = () => {
      el.style.transform = "";
      el.style.opacity = "";
    };
    run.then(clear, clear);
    // Cut short (another page change, or the setting flipped): jump to the
    // end rather than freezing half-faded.
    return () => run.complete();
  }, [pathname, mode]);

  return (
    <div className="flex min-w-0 flex-1 flex-col" ref={ref}>
      {children}
    </div>
  );
}
