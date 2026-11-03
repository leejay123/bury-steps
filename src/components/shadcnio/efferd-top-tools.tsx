"use client";

import { Moon, Search, Sun } from "lucide-react";
import { setColorMode } from "@/components/color-mode";
import { openSiteSearch, SiteSearchDialog } from "@/components/site-search";

// The top bar's icon buttons: plain (no outline), shaded on hover.
const ICON_BUTTON =
  "relative inline-flex size-8 shrink-0 items-center justify-center rounded-md text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4";

/**
 * The signed-in top bar's search and light / dark switch. Search opens the
 * same command box as the original header (⌘K / Ctrl+K); it's for signed-in
 * people only (its list is), so a visitor on a dashboard-style page (a shared
 * walk) sees just the light / dark switch. Customize stays in the main site's header.
 */
export function EfferdTopTools() {
  const toggleTheme = () => setColorMode(document.documentElement.classList.contains("dark") ? "light" : "dark");
  return (
    <>
      <button
        aria-label="Search"
        className={ICON_BUTTON}
        data-signed-in-only=""
        data-site-search=""
        onClick={openSiteSearch}
        title="Search (⌘K)"
        type="button"
      >
        <Search aria-hidden />
      </button>
      {/* Owners already have this in the hidden original header; the first
          instance keeps it. Everyone else needs a copy here. */}
      <SiteSearchDialog />
      <button aria-label="Switch light or dark" className={ICON_BUTTON} onClick={toggleTheme} title="Light / dark (D)" type="button">
        <Sun aria-hidden className="dark:hidden" />
        <Moon aria-hidden className="hidden dark:block" />
      </button>
    </>
  );
}
