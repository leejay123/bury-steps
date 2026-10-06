"use client";

import * as React from "react";
import { SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";
import {
  SEARCH_BUTTON_CLASS,
  SEARCH_ICON_CLASS,
  SEARCH_KBD_CLASS,
  SEARCH_LABEL_CLASS,
} from "@/components/header-chrome";
import dynamic from "next/dynamic";

export const OPEN_EVENT = "site-search:open";

/** Opens the search from anywhere (e.g. the mobile menu's search bar). */
export function openSiteSearch() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

const noSubscribe = () => () => {};

/** ⌘ on Macs and iPads, Ctrl everywhere else. The server (and hydration)
 * go by the browser's description of itself when the header passes it on,
 * else assume ⌘. */
function useIsApple(serverGuess = true) {
  return React.useSyncExternalStore(
    noSubscribe,
    () => /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent),
    () => serverGuess,
  );
}

/** A search icon on phones and tablets; a search-bar-shaped button from lg up. */
export function SiteSearchBar({
  apple,
  className,
  onOpen,
}: {
  /** From the server: whether this is a Mac, iPhone or iPad, for the ⌘K hint. */
  apple?: boolean;
  className?: string;
  onOpen?: () => void;
}) {
  return (
    <button
      aria-label="Search the site"
      data-site-search=""
      className={cn(SEARCH_BUTTON_CLASS, className)}
      onClick={() => {
        onOpen?.();
        openSiteSearch();
      }}
      type="button"
    >
      <SearchIcon aria-hidden className={SEARCH_ICON_CLASS} />
      <span className={SEARCH_LABEL_CLASS}>Search the site…</span>
      <Kbd className={SEARCH_KBD_CLASS}>{useIsApple(apple) ? "⌘K" : "Ctrl K"}</Kbd>
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
