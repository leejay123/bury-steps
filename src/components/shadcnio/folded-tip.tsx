"use client";

import { useSyncExternalStore, type ReactElement } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const WIDE = "(min-width: 64rem)";

/** Folded to icons on a computer (html[data-docs-sidebar="collapsed"], set before the first paint). */
function isFolded() {
  return document.documentElement.getAttribute("data-docs-sidebar") === "collapsed" && window.matchMedia(WIDE).matches;
}
function subscribe(change: () => void) {
  const observer = new MutationObserver(change);
  observer.observe(document.documentElement, { attributeFilter: ["data-docs-sidebar"], attributes: true });
  const wide = window.matchMedia(WIDE);
  wide.addEventListener("change", change);
  return () => {
    observer.disconnect();
    wide.removeEventListener("change", change);
  };
}

/**
 * A sidebar icon's name beside it while the sidebar is folded, as shadcn's sidebar
 * does (SidebarMenuButton's tooltip: to the right, hidden unless collapsed and on a
 * computer). The child must be one link or button.
 */
export function FoldedTip({ label, children }: { label: string; children: ReactElement }) {
  const folded = useSyncExternalStore(subscribe, isFolded, () => false);
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent align="center" hidden={!folded} side="right">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
