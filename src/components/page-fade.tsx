"use client";

import { ViewTransition, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * Fades the page content when the page changes, and only then. Keyed by
 * the path, so moving to another page is an exit + enter (animated with the
 * page-fade class in globals.css) while updates within the same page —
 * sections finishing loading, a list filtering — are plain updates, which
 * default="none" leaves un-animated.
 */
export function PageFade({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <ViewTransition default="none" enter="page-fade" exit="page-fade" key={pathname}>
      {children}
    </ViewTransition>
  );
}
