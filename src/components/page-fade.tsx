"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { PageTransition } from "@/lib/page-transition";

/** A single walk's page — organiser (/admin/walks/<id>) or member (/w/<slug>). */
const isWalkPage = (path: string) => /^\/(admin\/walks|w)\/[^/]+$/.test(path);

/**
 * Animates the page content when the page changes (Settings → Site
 * behaviour → Page transitions):
 *   "fade"  — a quick fade-in
 *   "slide" — opening a walk slides it in from the right, leaving it slides
 *             the list back in from the left; every other change fades
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

    if (direction) {
      ref.current?.animate(
        [
          { opacity: 0.3, transform: `translateX(${direction * 32}px)` },
          { opacity: 1, transform: "translateX(0)" },
        ],
        { duration: 260, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" },
      );
    } else {
      ref.current?.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: 180, easing: "ease-out" });
    }
  }, [pathname, mode]);

  return (
    <div className="flex min-w-0 flex-1 flex-col" ref={ref}>
      {children}
    </div>
  );
}
