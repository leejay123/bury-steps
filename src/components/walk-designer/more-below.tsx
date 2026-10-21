"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, LayoutList, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
 * On a phone or tablet, while a walk page's tab bar is off the screen: a
 * round button floating at the bottom right. Tapping it lists the tabs
 * (icon and name, a tick on the open one); choosing one opens that tab and
 * scrolls to it. A long page with no tabs gets a plain "More below" button
 * instead, until it's scrolled.
 */
export function MoreBelow() {
  // Whether there's a tab bar off the screen (the round button shows then).
  const [offScreen, setOffScreen] = useState(false);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
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
      // Shown only while the tab bar is off the screen (above or below).
      observer = new IntersectionObserver(([entry]) => setOffScreen(!entry.isIntersecting), {
        rootMargin: "-72px 0px -80px 0px",
      });
      observer.observe(bar);
    }, 600);
    return () => {
      window.clearTimeout(start);
      observer?.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  function choose(value: string) {
    setMenuOpen(false);
    const bar = visibleTabs();
    const trigger = [...(bar?.querySelectorAll<HTMLElement>('[data-slot="tabs-trigger"]') ?? [])].find(
      (tab) => tab.dataset.value === value,
    );
    // The tab bar changes tab on a press (mouse down), as when tapped.
    trigger?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 }));
    scrollToTabs(bar);
  }

  if (offScreen || menuOpen)
    return (
      // Bottom right, clear of the owners' chips (bottom left).
      <div className="fixed right-4 bottom-[calc(16px+var(--bottom-nav-offset,0px))] z-[56] md:right-6 lg:hidden">
        <Popover
          onOpenChange={(next) => {
            if (next) {
              const bar = visibleTabs();
              setTabs(bar ? readTabs(bar) : []);
            }
            setMenuOpen(next);
          }}
          open={menuOpen}
        >
          <PopoverTrigger asChild>
            <button
              aria-label="Jump to a tab"
              className="flex size-14 animate-in cursor-pointer touch-manipulation items-center justify-center rounded-full bg-foreground text-background shadow-lg fade-in-0 zoom-in-90"
              type="button"
            >
              {menuOpen ? <X className="size-6" /> : <LayoutList className="size-6" />}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 p-1.5" side="top" sideOffset={10}>
            <p className="px-2.5 pt-1.5 pb-2 text-xs font-medium text-muted-foreground">Jump to</p>
            <ul className="flex flex-col gap-0.5">
              {tabs.map((tab) => (
                <li key={tab.value}>
                  <button
                    className={
                      "flex w-full cursor-pointer touch-manipulation items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-sm font-medium " +
                      (tab.active ? "bg-muted" : "hover:bg-muted")
                    }
                    onClick={() => choose(tab.value)}
                    type="button"
                  >
                    {tab.icon ? (
                      <span
                        aria-hidden
                        className="contents [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: tab.icon }}
                      />
                    ) : null}
                    <span className="min-w-0 flex-1">{tab.label}</span>
                    {tab.active ? <Check aria-hidden className="size-4 shrink-0 text-primary" /> : null}
                  </button>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      </div>
    );

  if (!plain) return null;
  return (
    // Above the owners' Placeholders and Style chips when they're showing.
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(16px+var(--bottom-nav-offset,0px))] z-[56] flex justify-center px-4 md:px-6 lg:hidden [html:has([data-owner-chips])_&]:bottom-[calc(64px+var(--bottom-nav-offset,0px))]">
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
