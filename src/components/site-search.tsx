"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BellIcon,
  CircleHelpIcon,
  FileTextIcon,
  FootprintsIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  Undo2Icon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import type { SiteSearchGroup, SiteSearchKind } from "@/lib/site-search";

const OPEN_EVENT = "site-search:open";
const MAX_PER_GROUP = 5;
const GROUP_ICONS: Record<SiteSearchKind, LucideIcon> = {
  pages: FileTextIcon,
  walks: FootprintsIcon,
  notices: BellIcon,
  faqs: CircleHelpIcon,
  settings: SlidersHorizontalIcon,
};

/** Opens the search from anywhere (e.g. the mobile menu's search bar). */
export function openSiteSearch() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/** A search icon on phones; a search-bar-shaped button from md up. */
export function SiteSearchBar({ className, onOpen }: { className?: string; onOpen?: () => void }) {
  return (
    <button
      aria-label="Search the site"
      data-site-search=""
      className={cn(
        "flex size-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
        // Same round hover as the bell on phones; a bordered bar from md up.
        "md:h-8 md:w-44 md:justify-start md:rounded-md md:border md:bg-background md:px-2.5 md:shadow-xs lg:w-60",
        className,
      )}
      onClick={() => {
        onOpen?.();
        openSiteSearch();
      }}
      type="button"
    >
      <SearchIcon aria-hidden className="size-4 shrink-0 max-md:text-foreground" />
      <span className="truncate max-md:hidden">Search the site…</span>
      <Kbd className="ml-auto hidden lg:inline-flex">⌘K</Kbd>
    </button>
  );
}

// Shadcn studio Command 12 (scrollable menu + search footer), filled from
// /api/site-search, which only returns what this person may open.
export function SiteSearchDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [groups, setGroups] = React.useState<SiteSearchGroup[] | null>(null);
  const [failed, setFailed] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const loadedAt = React.useRef(0);

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    const onOpen = () => setOpen(true);
    document.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  const loading = React.useRef(false);
  const load = React.useCallback(() => {
    if (loading.current || Date.now() - loadedAt.current < 60_000) return;
    loading.current = true;
    fetch("/api/site-search", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then((data: { groups: SiteSearchGroup[] }) => {
        loadedAt.current = Date.now();
        setGroups(data.groups);
        setFailed(false);
      })
      .catch(() => setFailed(true))
      .finally(() => {
        loading.current = false;
      });
  }, []);

  // Fetch quietly once the page is idle, so opening search is instant.
  React.useEffect(() => {
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;
    const handle = idle(() => load());
    return () => cancel(handle);
  }, [load]);

  // Refresh in the background on open if it's a minute old (old results stay shown).
  React.useEffect(() => {
    if (open) load();
  }, [open, load]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  // Kept deliberately short: just Pages until you type, then only matches,
  // at most MAX_PER_GROUP per section.
  const visibleGroups = React.useMemo(() => {
    if (!groups) return [];
    const term = query.trim().toLowerCase();
    if (!term) return groups.filter((group) => group.kind === "pages");
    return groups
      .map((group) => ({
        ...group,
        items: group.items
          .filter((item) =>
            [item.label, item.hint ?? "", ...(item.keywords ?? [])].join(" ").toLowerCase().includes(term),
          )
          .slice(0, MAX_PER_GROUP),
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, query]);

  return (
    <CommandDialog
      className="w-full sm:max-w-lg"
      description="Search pages, walks, notices and more"
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
      open={open}
    >
      <Command shouldFilter={false}>
        <CommandInput onValueChange={setQuery} placeholder="Search pages, walks, notices…" value={query} />
        <CommandList>
          <CommandEmpty>
            {failed ? "Search couldn’t load. Try again." : groups ? "No results found." : "Loading…"}
          </CommandEmpty>
          {visibleGroups.map((group, index) => {
            const Icon = GROUP_ICONS[group.kind];
            return (
              <React.Fragment key={group.id}>
                {index > 0 ? <CommandSeparator /> : null}
                <CommandGroup heading={group.heading}>
                  {group.items.map((item) => (
                    <CommandItem
                      key={`${group.id}:${item.href}:${item.label}`}
                      onSelect={() => go(item.href)}
                      value={`${group.id} ${item.label} ${item.hint ?? ""}`}
                    >
                      <Icon />
                      <span className="truncate">{item.label}</span>
                      {item.hint ? <CommandShortcut className="tracking-normal">{item.hint}</CommandShortcut> : null}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </React.Fragment>
            );
          })}
        </CommandList>
        <CommandSeparator />
        <div className="hidden flex-wrap items-center gap-4 p-3 text-xs text-muted-foreground sm:flex">
          <div className="flex flex-1 items-center gap-2">
            <kbd className="rounded border px-1">esc</kbd>
            <span>To close</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex size-5 items-center justify-center rounded border">
              <Undo2Icon className="size-3.5" />
            </span>
            <span>To select</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex size-5 items-center justify-center rounded border">
              <ArrowUpIcon className="size-3.5" />
            </span>
            <span className="flex size-5 items-center justify-center rounded border">
              <ArrowDownIcon className="size-3.5" />
            </span>
            <span>To navigate</span>
          </div>
        </div>
      </Command>
    </CommandDialog>
  );
}
