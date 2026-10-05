"use client";

import * as React from "react";
import { SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";
import dynamic from "next/dynamic";

export const OPEN_EVENT = "site-search:open";

/** Opens the search from anywhere (e.g. the mobile menu's search bar). */
export function openSiteSearch() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

const noSubscribe = () => () => {};

/** ⌘ on Macs and iPads, Ctrl everywhere else. The server (and hydration) assume ⌘. */
function useIsApple() {
  return React.useSyncExternalStore(
    noSubscribe,
    () => /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent),
    () => true,
  );
}

/** A search icon on phones and tablets; a search-bar-shaped button from lg up. */
export function SiteSearchBar({ className, onOpen }: { className?: string; onOpen?: () => void }) {
  return (
    <button
      aria-label="Search the site"
      data-site-search=""
      className={cn(
        "flex size-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
        // Same round hover as the bell on phones and tablets; a bordered bar
        // from lg up. On tablets the bar took the room the menu links needed,
        // so the last one was cut off.
        "lg:h-8 lg:w-60 lg:justify-start lg:rounded-md lg:border lg:bg-background lg:px-2.5 lg:shadow-xs",
        className,
      )}
      onClick={() => {
        onOpen?.();
        openSiteSearch();
      }}
      type="button"
    >
      <SearchIcon aria-hidden className="size-4 shrink-0 max-lg:text-foreground" />
      <span className="truncate max-lg:hidden">Search the site…</span>
      <Kbd className="ml-auto hidden lg:inline-flex">{useIsApple() ? "⌘K" : "Ctrl K"}</Kbd>
    </button>
  );
}

/**
 * The search dialog itself (the command menu and its search code) is a
 * large download most visitors never use, so it isn't part of the page:
 * it loads the first time someone points at or focuses a search bar, and
 * opens when they tap it or press ⌘K. After that it handles itself.
 */
const loadDialog = () => import("@/components/site-search-dialog");
const LazySiteSearchDialog = dynamic(() => loadDialog().then((mod) => mod.SiteSearchDialogInner), { ssr: false });

export function SiteSearchDialog() {
  const [opened, setOpened] = React.useState(false);

  React.useEffect(() => {
    if (opened) return;
    const open = () => setOpened(true);
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        open();
      }
    };
    // Start downloading as soon as a search bar is pointed at or focused,
    // so it's usually ready by the time the tap lands.
    const warm = (event: Event) => {
      if ((event.target as Element | null)?.closest?.("[data-site-search]")) void loadDialog();
    };
    document.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, open);
    document.addEventListener("pointerover", warm, { passive: true });
    document.addEventListener("focusin", warm);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, open);
      document.removeEventListener("pointerover", warm);
      document.removeEventListener("focusin", warm);
    };
  }, [opened]);

  return opened ? <LazySiteSearchDialog initialOpen /> : null;
}
