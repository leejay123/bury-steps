"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * A quick fade-in of the page content when the page changes. The old page
 * stays fully on screen until the new one is ready, and the new one starts
 * part-visible (not from blank), so there's never a white gap between pages.
 * No View Transitions: they snapshot the page and faded through white on
 * phones. Skipped on first load and for people who prefer reduced motion.
 */
export function PageFade({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const firstPath = useRef(pathname);

  useEffect(() => {
    if (pathname === firstPath.current) return;
    firstPath.current = "";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    ref.current?.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: 180, easing: "ease-out" });
  }, [pathname]);

  return (
    <div className="flex min-w-0 flex-1 flex-col" ref={ref}>
      {children}
    </div>
  );
}
