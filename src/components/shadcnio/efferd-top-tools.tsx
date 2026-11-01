"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useHydrated } from "@/hooks/use-hydrated";
import { Moon, Search, Sun, X } from "lucide-react";
import { lockBackgroundScroll } from "@/components/overlay-scroll-lock";
import { setColorMode } from "@/components/color-mode";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SearchPanel, type SearchItem, type SearchPanelHandle } from "./search-panel";

// The top bar's icon buttons: plain (no outline), shaded on hover.
const ICON_BUTTON =
  "relative inline-flex size-8 shrink-0 items-center justify-center rounded-md text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4";

/**
 * The signed-in top bar's search and light / dark switch, in Efferd's button style:
 * the same search panel as the main header's, opened under the button; the switch
 * flips light and dark (D does too). Customize stays in the main site's header.
 */
export function EfferdTopTools({ search, siteName }: { search: SearchItem[]; siteName: string }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const hydrated = useHydrated();
  const searchRef = useRef<SearchPanelHandle>(null);
  const sheetRef = useRef<SearchPanelHandle>(null);
  // On phones search fills the screen, as the homepage's does; the page stays still behind it.
  useEffect(() => {
    if (!sheetOpen) return;
    const unlock = lockBackgroundScroll();
    const panel = sheetRef.current;
    const focus = window.setTimeout(() => sheetRef.current?.focus(), 60);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSheetOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      unlock();
      window.clearTimeout(focus);
      document.removeEventListener("keydown", onKey);
      panel?.reset();
    };
  }, [sheetOpen]);
  const toggleTheme = () => setColorMode(document.documentElement.classList.contains("dark") ? "light" : "dark");
  return (
    <>
      <Popover
        onOpenChange={(open) => {
          if (open && window.matchMedia("(max-width: 1023.98px)").matches) {
            setSheetOpen(true);
            return;
          }
          setSearchOpen(open);
          if (open) window.setTimeout(() => searchRef.current?.focus(), 30);
          else searchRef.current?.reset();
        }}
        open={searchOpen}
      >
        <PopoverTrigger asChild>
          <button aria-label="Search" className={ICON_BUTTON} title="Search" type="button">
            <Search aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[min(40rem,calc(100vw-2rem))]" data-efferd-pop="" data-search-pop="">
          <SearchPanel
            items={search}
            onGo={() => setSearchOpen(false)}
            ref={searchRef}
            siteName={siteName.split(" ").slice(0, 2).join(" ")}
          />
        </PopoverContent>
      </Popover>
      {/* Drawn at the page's top level: the top bar's blur would otherwise keep a "fixed"
          sheet inside the bar instead of filling the screen. */}
      {hydrated ? createPortal(
      <div
        aria-hidden={sheetOpen ? undefined : true}
        aria-label="Search"
        aria-modal="true"
        className="group/sheet fixed inset-0 z-[70] flex flex-col bg-background opacity-0 transition-[opacity,visibility,translate] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] -translate-y-2 data-[state=closed]:invisible data-[state=open]:translate-y-0 data-[state=open]:opacity-100 lg:hidden"
        data-efferd-pop=""
        data-state={sheetOpen ? "open" : "closed"}
        inert={!sheetOpen}
        role="dialog"
      >
        <div className="flex h-14 shrink-0 items-center justify-end border-b px-4">
          <button aria-label="Close search" className={ICON_BUTTON} onClick={() => setSheetOpen(false)} type="button">
            <X aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          <SearchPanel
            items={search}
            onGo={() => setSheetOpen(false)}
            ref={sheetRef}
            siteName={siteName.split(" ").slice(0, 2).join(" ")}
          />
        </div>
      </div>,
        document.body,
      ) : null}
      <button aria-label="Switch light or dark" className={ICON_BUTTON} onClick={toggleTheme} title="Light / dark (D)" type="button">
        <Sun aria-hidden className="dark:hidden" />
        <Moon aria-hidden className="hidden dark:block" />
      </button>
    </>
  );
}
