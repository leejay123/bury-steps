"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

/** Room left for the sticky site header when scrolling the tabs into view. */
const HEADER_ROOM = 72;

/** The first tab bar on show (a walk page holds the signed-in and signed-out copies). */
function visibleTabs(): HTMLElement | null {
  const bars = document.querySelectorAll<HTMLElement>('main [data-slot="tabs-list"]');
  return [...bars].find((bar) => bar.getClientRects().length > 0) ?? null;
}

/**
 * On a phone or tablet, a "More below" button floating over the bottom of a
 * walk page when there's more under the first screen (usually the tabs). It
 * names the tabs (or counts them, if their names are long), and tapping it
 * scrolls to them. It goes for good once the page is scrolled.
 */
export function MoreBelow() {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    let gone = false;
    // Decide once the page has settled (photos and maps take their space).
    const check = window.setTimeout(() => {
      if (gone || window.scrollY > 40) return;
      const tabs = visibleTabs();
      if (tabs) {
        if (tabs.getBoundingClientRect().top < window.innerHeight - 120) return;
        const names = [...tabs.querySelectorAll('[data-slot="tabs-trigger"]')]
          .map((tab) => tab.textContent?.trim())
          .filter(Boolean);
        // The tabs' names when they're short enough to read in full,
        // otherwise just how many there are.
        const named = names.join(" · ");
        setLabel(
          names.length === 0
            ? "More below"
            : named.length <= 24
              ? `More below: ${named}`
              : `${names.length} tabs below`,
        );
      } else if (document.documentElement.scrollHeight > window.innerHeight + 200) {
        setLabel("More below");
      }
    }, 600);
    const onScroll = () => {
      if (window.scrollY < 40) return;
      gone = true;
      setLabel(null);
      window.removeEventListener("scroll", onScroll);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(check);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  if (!label) return null;

  function go() {
    const tabs = visibleTabs();
    const top = tabs
      ? tabs.getBoundingClientRect().top + window.scrollY - HEADER_ROOM
      : window.scrollY + window.innerHeight * 0.7;
    window.scrollTo({ top, behavior: "smooth" });
  }

  return (
    // Above the owners' Placeholders and Style chips when they're showing.
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(16px+var(--bottom-nav-offset,0px))] z-[56] flex justify-center px-4 md:px-6 lg:hidden [html:has([data-owner-chips])_&]:bottom-[calc(64px+var(--bottom-nav-offset,0px))]">
      <button
        className="pointer-events-auto flex w-full max-w-xl animate-in cursor-pointer touch-manipulation items-center justify-center gap-1.5 rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background shadow-lg fade-in-0 slide-in-from-bottom-2"
        onClick={go}
        type="button"
      >
        <span className="truncate">{label}</span>
        <ChevronDown aria-hidden className="size-4 shrink-0 animate-bounce" />
      </button>
    </div>
  );
}
