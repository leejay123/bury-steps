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
  SlidersHorizontalIcon,
  Undo2Icon,
  type LucideIcon,
} from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonReveal } from "@/components/spectrumui/skeleton-reveal";
import type { SiteSearchGroup, SiteSearchKind } from "@/lib/site-search";

import { OPEN_EVENT } from "@/components/site-search";
const MAX_PER_GROUP = 5;
const GROUP_ICONS: Record<SiteSearchKind, LucideIcon> = {
  pages: FileTextIcon,
  walks: FootprintsIcon,
  notices: BellIcon,
  faqs: CircleHelpIcon,
  settings: SlidersHorizontalIcon,
};


// Shadcn studio Command 12 (scrollable menu + search footer), filled from
// /api/site-search, which only returns what this person may open.
export function SiteSearchDialogInner({ initialOpen }: { initialOpen: boolean }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(initialOpen);
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
          {groups || failed ? (
            <CommandEmpty>{failed && !groups ? "Search couldn’t load. Try again." : "No results found."}</CommandEmpty>
          ) : null}
          {/* Spectrum UI's skeleton reveal: pulses until the results arrive,
              then cross-fades and un-blurs into them. */}
          <SkeletonReveal className={groups ? undefined : "min-h-48"} loading={!groups && !failed} skeleton={<SearchSkeleton />}>
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
          </SkeletonReveal>
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

function SearchSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-3 p-3">
      <Skeleton className="h-3 w-16" />
      {Array.from({ length: 4 }, (_, index) => (
        <div className="flex items-center gap-2" key={index}>
          <Skeleton className="size-4 rounded-sm" />
          <Skeleton className="h-3.5" style={{ width: `${[45, 30, 55, 38][index]}%` }} />
        </div>
      ))}
    </div>
  );
}
