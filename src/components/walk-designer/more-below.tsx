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

type Tab = { value: string; label: string; icon: string | null; active: boolean };

/** The tabs in a bar as they are now (names, icons, which is open). */
function readTabs(bar: HTMLElement): Tab[] {
  return [...bar.querySelectorAll<HTMLElement>('[data-slot="tabs-trigger"]')].map((tab) => ({
    value: tab.dataset.value ?? "",
    label: (tab.textContent ?? "").trim(),
    icon: tab.querySelector("svg")?.outerHTML ?? null,
    active: tab.dataset.state === "active",
  }));
}

function scrollToTabs(bar: HTMLElement | null) {
  const top = bar
    ? bar.getBoundingClientRect().top + window.scrollY - HEADER_ROOM
    : window.scrollY + window.innerHeight * 0.7;
  window.scrollTo({ top, behavior: "smooth" });
}

/**
 * On a phone or tablet, while a walk page's tabs are still below the
 * screen: a bar floating over the bottom with each tab (icon and name).
 * Tapping one opens that tab and scrolls down to it. It goes while the tabs
 * are in view and comes back if they're scrolled off below again. A long
 * page with no tabs gets a plain "More below" button instead, until it's
 * scrolled.
 */
export function MoreBelow() {
  const [tabs, setTabs] = useState<Tab[] | null>(null);
  const [plain, setPlain] = useState(false);

  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    let gone = false;
    const onScroll = () => {
      if (window.scrollY < 40) return;
      gone = true;
      setPlain(false);
      window.removeEventListener("scroll", onScroll);
    };
    // Decide once the page has settled (photos and maps take their space).
    const start = window.setTimeout(() => {
      const bar = visibleTabs();
      if (!bar) {
        if (!gone && window.scrollY < 40 && document.documentElement.scrollHeight > window.innerHeight + 200) {
          setPlain(true);
          window.addEventListener("scroll", onScroll, { passive: true });
        }
        return;
      }
      // Shown only while the tab bar is below the bottom of the screen.
      observer = new IntersectionObserver(
        ([entry]) => {
          const below = !entry.isIntersecting && entry.boundingClientRect.top > 0;
          setTabs(below ? readTabs(bar) : null);
        },
        { rootMargin: "0px 0px -80px 0px" },
      );
      observer.observe(bar);
    }, 600);
    return () => {
      window.clearTimeout(start);
      observer?.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  function open(value: string) {
    const bar = visibleTabs();
    const trigger = [...(bar?.querySelectorAll<HTMLElement>('[data-slot="tabs-trigger"]') ?? [])].find(
      (tab) => tab.dataset.value === value,
    );
    // The tab bar changes tab on a press (mouse down), as when tapped.
    trigger?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 }));
    scrollToTabs(bar);
  }

  const wrap =
    "pointer-events-none fixed inset-x-0 bottom-[calc(16px+var(--bottom-nav-offset,0px))] z-[56] flex justify-center px-4 md:px-6 lg:hidden [html:has([data-owner-chips])_&]:bottom-[calc(64px+var(--bottom-nav-offset,0px))]";

  if (tabs && tabs.length > 0)
    return (
      // Above the owners' Placeholders and Style chips when they're showing.
      <div className={wrap}>
        <nav
          aria-label="Jump to a tab"
          className="pointer-events-auto flex w-full max-w-xl animate-in gap-1 overflow-x-auto rounded-2xl border bg-background/95 p-1.5 shadow-lg backdrop-blur fade-in-0 slide-in-from-bottom-2 [scrollbar-width:none]"
        >
          {tabs.map((tab) => (
            <button
              className={
                // Icon over the name (two short lines at most), like the
                // bottom menu bar, so five tabs still fit across a phone.
                "flex min-w-14 flex-1 cursor-pointer touch-manipulation flex-col items-center justify-start gap-1 rounded-xl px-1.5 py-2 text-[11px] leading-tight font-medium " +
                (tab.active ? "bg-foreground text-background" : "text-foreground hover:bg-muted")
              }
              key={tab.value}
              onClick={() => open(tab.value)}
              type="button"
            >
              {tab.icon ? (
                <span
                  aria-hidden
                  className="contents [&>svg]:size-5 [&>svg]:shrink-0"
                  dangerouslySetInnerHTML={{ __html: tab.icon }}
                />
              ) : null}
              <span className="line-clamp-2 text-center">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    );

  if (!plain) return null;
  return (
    <div className={wrap}>
      <button
        className="pointer-events-auto flex w-full max-w-xl animate-in cursor-pointer touch-manipulation items-center justify-center gap-1.5 rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background shadow-lg fade-in-0 slide-in-from-bottom-2"
        onClick={() => scrollToTabs(null)}
        type="button"
      >
        <span className="truncate">More below</span>
        <ChevronDown aria-hidden className="size-4 shrink-0 animate-bounce" />
      </button>
    </div>
  );
}
