"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatWalkDay } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { useWalkParts } from "./parts";

/** The first tab bar on show (a walk page holds the signed-in and signed-out copies). */
function visibleTabs(): HTMLElement | null {
  const bars = document.querySelectorAll<HTMLElement>('main [data-slot="tabs-list"]');
  return [...bars].find((bar) => bar.getClientRects().length > 0) ?? null;
}

/** Where the site header ends (it's taller with an announcement showing). */
function headerBottom(): number {
  return document.querySelector("[data-site-header]")?.getBoundingClientRect().bottom ?? 64;
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
    ? bar.getBoundingClientRect().top + window.scrollY - headerBottom() - 8
    : window.scrollY + window.innerHeight * 0.7;
  window.scrollTo({ top, behavior: "smooth" });
}

/**
 * On a phone or tablet, once the walk's name has scrolled away and while
 * its tab bar isn't on screen: a slim bar under the site header with the
 * walk's name and date and the tabs as icons (the open one underlined).
 * Tapping one opens that tab and scrolls to it. A long page with no tabs
 * gets a plain "More below" button instead, until it's scrolled.
 */
export function MoreBelow() {
  const parts = useWalkParts();
  const [mini, setMini] = useState<{ top: number; tabs: Tab[] } | null>(null);
  const [plain, setPlain] = useState(false);

  useEffect(() => {
    let frame = 0;
    let gone = false;
    const update = () => {
      frame = 0;
      const bar = visibleTabs();
      if (!bar) return setMini(null);
      const top = headerBottom();
      // The walk's name on show (not the hidden signed-in or signed-out copy's).
      const title = [...document.querySelectorAll<HTMLElement>("main h1")].find(
        (h1) => h1.getClientRects().length > 0,
      );
      const titlePassed = title ? title.getBoundingClientRect().bottom < top : window.scrollY > 200;
      const rect = bar.getBoundingClientRect();
      const tabsInView = rect.bottom > top && rect.top < window.innerHeight;
      setMini(titlePassed && !tabsInView ? { top, tabs: readTabs(bar) } : null);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
      if (!gone && window.scrollY > 40) {
        gone = true;
        setPlain(false);
      }
    };
    // Decide once the page has settled (photos and maps take their space).
    const start = window.setTimeout(() => {
      if (!visibleTabs() && !gone && window.scrollY < 40) {
        setPlain(document.documentElement.scrollHeight > window.innerHeight + 200);
      }
      update();
    }, 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.clearTimeout(start);
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  function choose(value: string) {
    const bar = visibleTabs();
    const trigger = [...(bar?.querySelectorAll<HTMLElement>('[data-slot="tabs-trigger"]') ?? [])].find(
      (tab) => tab.dataset.value === value,
    );
    // The tab bar changes tab on a press (mouse down), as when tapped.
    trigger?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 }));
    scrollToTabs(bar);
  }

  if (mini && mini.tabs.length > 0)
    return (
      <nav
        aria-label="Jump to a tab"
        className="fixed inset-x-0 z-[65] animate-in border-b bg-background/95 shadow-[0_6px_16px_-8px_rgb(0_0_0/0.15)] backdrop-blur fade-in-0 slide-in-from-top-2 lg:hidden"
        style={{ top: mini.top }}
      >
        {parts ? (
          <div className="flex items-center justify-between gap-3 px-4 pt-2 text-xs md:px-6">
            <span className="min-w-0 truncate font-semibold">{parts.headline.title}</span>
            <span className="shrink-0 text-muted-foreground" suppressHydrationWarning>
              {formatWalkDay(new Date(parts.headline.startsAt))}
            </span>
          </div>
        ) : null}
        <div
          className="grid px-2 md:px-4"
          style={{ gridTemplateColumns: `repeat(${mini.tabs.length}, minmax(0, 1fr))` }}
        >
          {mini.tabs.map((tab) => (
            <button
              aria-current={tab.active ? "true" : undefined}
              aria-label={tab.label}
              className={cn(
                "flex h-11 cursor-pointer touch-manipulation items-center justify-center border-b-2",
                tab.active ? "border-foreground text-foreground" : "border-transparent text-muted-foreground",
              )}
              key={tab.value}
              onClick={() => choose(tab.value)}
              title={tab.label}
              type="button"
            >
              {tab.icon ? (
                <span
                  aria-hidden
                  className="contents [&>svg]:size-5 [&>svg]:shrink-0"
                  dangerouslySetInnerHTML={{ __html: tab.icon }}
                />
              ) : (
                <span className="truncate px-1 text-xs font-medium">{tab.label}</span>
              )}
            </button>
          ))}
        </div>
      </nav>
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
