"use client";

import { useRef, useState } from "react";
import { Moon, Search, Sun, WandSparkles } from "lucide-react";
import { setColorMode } from "@/components/color-mode";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CustomizeDot, CustomizePanel } from "./customize-panel";
import { SearchPanel, type SearchItem, type SearchPanelHandle } from "./search-panel";

// Efferd's top-bar buttons (their "icon-sm" outline buttons).
const ICON_BUTTON =
  "relative inline-flex size-7 shrink-0 items-center justify-center rounded-md border bg-background text-foreground shadow-xs outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-3.5";

/**
 * The signed-in top bar's search, Customize and light / dark switch, in Efferd's
 * button style: the same search and Customize panels as the main header's, opened
 * in a panel under the button; the switch flips light and dark (D does too).
 */
export function EfferdTopTools({ search, siteName }: { search: SearchItem[]; siteName: string }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<SearchPanelHandle>(null);
  const toggleTheme = () => setColorMode(document.documentElement.classList.contains("dark") ? "light" : "dark");
  return (
    <>
      <Popover
        onOpenChange={(open) => {
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
      <Popover>
        <PopoverTrigger asChild>
          <button aria-label="Customize" className={ICON_BUTTON} title="Customize" type="button">
            <WandSparkles aria-hidden />
            <CustomizeDot />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))]" data-efferd-pop="">
          <CustomizePanel />
        </PopoverContent>
      </Popover>
      <button aria-label="Switch light or dark" className={ICON_BUTTON} onClick={toggleTheme} title="Light / dark (D)" type="button">
        <Sun aria-hidden className="dark:hidden" />
        <Moon aria-hidden className="hidden dark:block" />
      </button>
    </>
  );
}
