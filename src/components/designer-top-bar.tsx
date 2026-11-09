"use client";

import { createContext, useContext, useEffect, useId, useState, type ReactNode } from "react";
import { usePuck, type Data, type UiState, type Viewports } from "@puckeditor/core";
import { ChevronDown, Monitor, Search, SlidersHorizontal, Smartphone, Tablet, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";

/** The preview sizes, in the top bar: a phone, a tablet, then the full width. */
const SIZES = [
  { label: "Phone", width: 390, icon: Smartphone },
  { label: "Tablet", width: 768, icon: Tablet },
  { label: "Computer", width: "100%", icon: Monitor },
] as const;

/** Give Puck these (its `viewports` prop) so it knows the three sizes. */
export const DESIGNER_VIEWPORTS: Viewports = SIZES.map((size) => ({
  width: size.width,
  height: "auto",
  label: size.label,
}));

/** Puck's starting view (its `ui` prop): the phone size, and Puck's own small size
 * controls under the page hidden — the top bar has them instead. */
export const DESIGNER_UI: Partial<UiState> = {
  viewports: {
    current: { width: 390, height: "auto" },
    controlsVisible: false,
    options: DESIGNER_VIEWPORTS,
  },
};

export type DesignerStatus = { label: string; tone: "draft" | "published" | "live" };

const STATUS_TONE: Record<DesignerStatus["tone"], { pill: string; dot: string }> = {
  draft: { pill: "bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100", dot: "bg-amber-600" },
  published: {
    pill: "bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
    dot: "bg-emerald-600",
  },
  live: { pill: "bg-muted text-foreground", dot: "bg-muted-foreground" },
};

/** The widest each panel can be dragged: never more than about a third of the window,
 * so the page being designed always has room (Puck allows any width, and remembers it). */
const PANEL_MAX = { left: 360, right: 420 } as const;
const panelMax = (side: "left" | "right") =>
  Math.min(PANEL_MAX[side], Math.round(window.innerWidth * 0.32));

/** A segment of the bar: full height, split off by a line (as the site's edge strips). */
const SEGMENT = "flex shrink-0 items-center border-l";
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset";

/**
 * The designers' one slim top bar (Puck's `overrides.header`, so it sits inside Puck
 * and can change the preview size): Close, what's being designed and how it stands,
 * View (a panel with what the preview shows and which panels are open), the preview
 * size as icons, then the actions with Publish last, over the settings panel.
 */
export function DesignerTopBar({
  busy = false,
  closeLabel,
  note,
  noteAlways = false,
  onClose,
  onPublish,
  secondary,
  status,
  title,
  view,
}: {
  busy?: boolean;
  closeLabel: string;
  /** What the designer does, on hover over the title (shown in the bar when noteAlways). */
  note?: string;
  /** Show the note in the bar (a question that needs answering). */
  noteAlways?: boolean;
  onClose: () => void;
  onPublish: (data: Data) => void | Promise<void>;
  /** Before Publish (Discard draft). */
  secondary?: ReactNode;
  status?: DesignerStatus;
  title: string;
  /** The View panel's own choices (the walk designer's For, Preview…), and what's picked, in a few words. */
  view?: { summary?: string; content: ReactNode };
}) {
  const { appState, dispatch } = usePuck();
  const viewports = appState.ui.viewports;
  const ui = appState.ui;
  const [viewOpen, setViewOpen] = useState(false);

  // A panel dragged (or remembered) wider than its limit goes back to the limit.
  useEffect(() => {
    const left = ui.leftSideBarWidth;
    const right = ui.rightSideBarWidth;
    const next: Partial<typeof ui> = {};
    if (left && left > panelMax("left")) next.leftSideBarWidth = panelMax("left");
    if (right && right > panelMax("right")) next.rightSideBarWidth = panelMax("right");
    if (Object.keys(next).length) dispatch({ type: "setUi", ui: next });
  }, [ui.leftSideBarWidth, ui.rightSideBarWidth, dispatch]);

  const panels = [
    { label: "Blocks panel", on: ui.leftSideBarVisible, key: "leftSideBarVisible" as const },
    { label: "Settings panel", on: ui.rightSideBarVisible, key: "rightSideBarVisible" as const },
  ];
  const setWidth = (width: number | "100%") =>
    dispatch({ type: "setUi", ui: { viewports: { ...viewports, current: { width, height: "auto" } } } });

  return (
    <div className="flex h-12 shrink-0 items-stretch border-b bg-background">
      {/* As wide as the Blocks rail below, so its line runs straight down. */}
      <button
        aria-label={closeLabel}
        className={cn(
          "flex w-(--puck-pluginbar-width,3.5rem) shrink-0 items-center justify-center border-r hover:bg-accent disabled:opacity-50",
          FOCUS,
        )}
        disabled={busy}
        onClick={onClose}
        title={closeLabel}
        type="button"
      >
        <X aria-hidden className="size-4" />
      </button>
      <div className="flex min-w-0 flex-1 items-center gap-2.5 px-4" title={noteAlways ? undefined : note}>
        <span className="truncate font-semibold text-sm">{title}</span>
        {status ? (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
              STATUS_TONE[status.tone].pill,
            )}
          >
            <span aria-hidden className={cn("size-1.5 rounded-full", STATUS_TONE[status.tone].dot)} />
            {status.label}
          </span>
        ) : null}
        {note && noteAlways ? <span className="truncate font-medium text-amber-700 text-xs dark:text-amber-300">{note}</span> : null}
      </div>
      {/* View: what the preview shows, and which panels are open. */}
      <Popover onOpenChange={setViewOpen} open={viewOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              SEGMENT,
              "min-w-0 gap-2 px-3.5 text-sm",
              FOCUS,
              viewOpen ? "bg-accent text-accent-foreground" : "hover:bg-accent/60",
            )}
            type="button"
          >
            <SlidersHorizontal aria-hidden className="size-4 shrink-0" />
            <span className="font-semibold">View</span>
            {view?.summary ? (
              <span className="hidden max-w-[22rem] truncate text-muted-foreground xl:inline">{view.summary}</span>
            ) : null}
            <ChevronDown
              aria-hidden
              className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", viewOpen && "rotate-180")}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="z-[100] w-[22rem] overflow-hidden rounded-xl p-0">
          {view?.content}
          <div className="flex flex-col gap-3 bg-muted/40 px-4 py-3">
            {panels.map((panel) => (
              <PanelSwitch
                key={panel.key}
                label={panel.label}
                on={Boolean(panel.on)}
                onChange={(on) => dispatch({ type: "setUi", ui: { [panel.key]: on } })}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <div aria-label="Preview size" className="flex" role="group">
        {SIZES.map((size) => {
          const on = viewports.current.width === size.width;
          const Icon = size.icon;
          return (
            <button
              aria-label={size.label}
              aria-pressed={on}
              className={cn(
                SEGMENT,
                "w-12 justify-center",
                FOCUS,
                on ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              )}
              key={size.label}
              onClick={() => setWidth(size.width)}
              title={size.label}
              type="button"
            >
              <Icon aria-hidden className="size-4" />
            </button>
          );
        })}
      </div>
      {/* Exactly over the settings panel while it shows, so the line beside
          the actions runs straight down its edge. */}
      <div
        className={cn(
          SEGMENT,
          "gap-2 px-3",
          ui.rightSideBarVisible && "w-(--puck-sidebar-right-width) justify-end",
        )}
      >
        {secondary}
        <Button disabled={busy} onClick={() => void onPublish(appState.data)} size="sm" type="button">
          Publish
        </Button>
      </div>
    </div>
  );
}

function PanelSwitch({ label, on, onChange }: { label: string; on: boolean; onChange: (on: boolean) => void }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-3">
      <label className="text-sm" htmlFor={id}>
        {label}
      </label>
      <Switch checked={on} id={id} onCheckedChange={onChange} />
    </div>
  );
}

/** One section of the View panel: a small heading and its choices. */
export function ViewSection({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="flex flex-col gap-2 border-b px-4 py-3.5">
      <span className="font-semibold text-muted-foreground text-xs">{label}</span>
      {children}
    </div>
  );
}

/**
 * Choices as buttons in one box, all on show (instead of a dropdown): the
 * picked one shaded. Lines between them, top and left, clipped at the box's
 * edge, so rows that wrap still have one line each.
 */
export function ViewChoices<T extends string>({
  columns = 3,
  label,
  onChange,
  options,
  value,
}: {
  columns?: 2 | 3;
  label: string;
  onChange: (value: T) => void;
  options: readonly { id: T; label: string }[];
  value: T | null;
}) {
  return (
    <div
      aria-label={label}
      className={cn("grid overflow-hidden rounded-lg border", columns === 2 ? "grid-cols-2" : "grid-cols-3")}
      role="group"
    >
      {options.map((option) => {
        const on = option.id === value;
        return (
          <button
            aria-pressed={on}
            className={cn(
              "min-h-9 px-2 py-1.5 text-[0.8125rem] leading-tight shadow-[-1px_0_0_0_var(--border),0_-1px_0_0_var(--border)]",
              FOCUS,
              on ? "bg-accent font-semibold text-accent-foreground" : "hover:bg-accent/60",
            )}
            key={option.id}
            onClick={() => onChange(option.id)}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The top bar reaches Puck through a context and one stable header
 * (`overrides.header: DesignerTopBarSlot`): a header made fresh on every
 * change counts as a new one to React, which rebuilt it and shut the View
 * panel whenever a choice in it changed the preview.
 */
const TopBarSlot = createContext<ReactNode>(null);
export const DesignerTopBarProvider = TopBarSlot.Provider;
export function DesignerTopBarSlot() {
  return <>{useContext(TopBarSlot)}</>;
}

/** The Blocks panel's search: what's typed, for each block to check itself against. */
const BlockSearch = createContext("");

/**
 * Puck's `overrides.components` (the Blocks panel's list): a Find a block box over
 * the list; each block (`overrides.componentItem`, BlockSearchItem) hides itself
 * when its name doesn't match. While searching, the group headings step aside.
 */
export function BlockSearchList({ children }: { children?: ReactNode }) {
  const [query, setQuery] = useState("");
  const id = useId();
  return (
    <div data-block-search={query.trim() ? "on" : "off"}>
      <div className="mb-3 flex h-9 items-center gap-2 rounded-lg border bg-background px-3 focus-within:ring-2 focus-within:ring-ring">
        <Search aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        <label className="sr-only" htmlFor={id}>
          Find a block
        </label>
        <input
          className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:appearance-none"
          id={id}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find a block"
          type="search"
          value={query}
        />
        {query ? (
          <button
            aria-label="Clear the search"
            className="rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            onClick={() => setQuery("")}
            type="button"
          >
            <X aria-hidden className="size-3.5" />
          </button>
        ) : null}
      </div>
      <BlockSearch.Provider value={query.trim().toLowerCase()}>{children}</BlockSearch.Provider>
    </div>
  );
}

/**
 * One block in the Blocks panel, marked as matching the search or not. Puck keeps
 * a holder round every block, so the hiding is done in globals.css: a holder (and
 * a group) with no match inside is taken out, leaving no gaps.
 */
export function BlockSearchItem({ children, label }: { children?: ReactNode; label: string }) {
  const query = useContext(BlockSearch);
  const match = !query || label.toLowerCase().includes(query);
  return (
    <span className="contents" data-block-match={match ? "yes" : "no"}>
      {children}
    </span>
  );
}
