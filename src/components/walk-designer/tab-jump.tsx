"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  LayoutList,
  Search,
  X,
} from "lucide-react";
import { formatWalkDay } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { useWalkNow } from "@/components/walk-header-styles";
import type { WalkIdeaParts } from "@/components/walk-idea-layouts";
import { useWalkParts } from "./parts";

/**
 * Ways to get to a walk page's tabs on a phone or tablet, chosen on the Tabs
 * block (Jump to tabs on phones) — the floating ones — or placed as the Tab
 * shortcuts block — the ones that sit on the page. Both read the tab bar
 * that's on show, and choosing a tab opens it and scrolls to it. They
 * measure the page they're drawn in, so they work in the designer's
 * preview too.
 */

export const TAB_JUMP_LOOKS: [string, string][] = [
  ["sticky", "Sticky mini tab bar under the header"],
  ["sticky-labels", "Sticky bar with names under the icons"],
  ["sticky-track", "Sticky bar in a grey track"],
  ["sticky-green", "Sticky bar, the open tab a green pill"],
  ["sticky-chips", "Sticky named chips that swipe"],
  ["header", "The header turns into the tabs"],
  ["sticky-line", "Sticky bar with a reading line"],
  ["sticky-dark", "Dark floating sticky bar"],
  ["sticky-numbers", "Sticky bar with numbered tabs"],
  ["sticky-status", "Sticky bar with the walk's status"],
  ["sticky-dropdown", "Sticky tab name with a Sections menu"],
  ["breadcrumb", "Breadcrumb with a menu"],
  ["drill", "Tab name with back, and previous / next"],
  ["round", "Round button with a list"],
  ["speed-dial", "Speed-dial circles"],
  ["peek", "Peek tab bar at the bottom"],
  ["ring", "Progress ring button"],
  ["sheet", "Bottom sheet list"],
  ["top-pill", "Top pill that drops down"],
  ["arc", "Arc menu"],
  ["rail", "Side icons rail"],
  ["stepper", "Previous / next pill"],
  ["grid", "Tile grid menu"],
  ["bottom-bar", "Walk tabs as the bottom bar"],
  ["glass", "Glass capsule"],
  ["segmented", "Named switcher at the bottom"],
  ["tabs-button", "Green Tabs button"],
  ["expand-pill", "Pill that grows into the list"],
  ["swipe-handle", "Swipe-up handle"],
  ["wheel", "Thumb wheel"],
  ["search", "Find a tab search"],
  ["big-menu", "Big type menu"],
  ["sections", "Sections button by the header"],
  ["drawer", "Side drawer"],
  ["edges", "Arrows on the edges"],
  ["folders", "Folder tabs on the edge"],
  ["dock", "Dock that grows"],
  ["toast", "Message that points down"],
  ["bubble", "Where-you-are bubble by the scrollbar"],
  ["mini-sheet", "Mini panel that stays at the bottom"],
  ["ladder", "Progress ladder of dots"],
  ["corner", "Corner switcher with up and down"],
  ["more-below", "Plain More below button"],
  ["none", "Nothing"],
];

export const TAB_SHORTCUT_LOOKS: [string, string][] = [
  ["on-this-walk", "On this walk links (two columns)"],
  ["cards", "Tab cards"],
  ["swipe-cards", "Cards that swipe sideways"],
  ["contents", "In this walk contents list"],
  ["steps", "Numbered steps"],
  ["icon-row", "Row of round icons"],
  ["stories", "Story-style circles"],
  ["quick", "Big coloured buttons"],
  ["questions", "Question chips"],
];

type Tab = {
  value: string;
  label: string;
  icon: string | null;
  active: boolean;
};
type State = {
  tabs: Tab[];
  look: string;
  /** Where the tab bar is: on screen, or off it above or below. */
  where: "in" | "above" | "below";
  titlePassed: boolean;
  /** Where the site header ends (0 in the designer). */
  top: number;
  /** How far down the page, 0 to 1. */
  progress: number;
  scrollY: number;
};

const PASTELS = [
  "bg-zinc-100 text-zinc-800",
  "bg-emerald-100 text-emerald-900",
  "bg-orange-100 text-orange-900",
  "bg-sky-100 text-sky-900",
  "bg-violet-100 text-violet-900",
  "bg-rose-100 text-rose-900",
  "bg-lime-100 text-lime-900",
];
const SOLIDS = [
  "bg-zinc-800 text-white",
  "bg-emerald-700 text-white",
  "bg-orange-600 text-white",
  "bg-sky-700 text-white",
  "bg-violet-700 text-white",
  "bg-rose-700 text-white",
  "bg-lime-700 text-white",
];

/** Words people ask, for the question chips (from the tab's name). */
const QUESTIONS: [RegExp, string][] = [
  [/map|where|location|meet/i, "Where do we meet?"],
  [/weather|forecast/i, "What's the weather?"],
  [/before|set off|bring|kit|pack|essential/i, "What should I bring?"],
  [/attend|who|people|going/i, "Who's going?"],
  [/journey|route|update/i, "Where are they now?"],
  [/detail|about|info/i, "What's this walk like?"],
];

function visibleBar(doc: Document): HTMLElement | null {
  const bars = doc.querySelectorAll<HTMLElement>('[data-slot="tabs-list"]');
  return [...bars].find((bar) => bar.getClientRects().length > 0) ?? null;
}

function readTabs(bar: HTMLElement): Tab[] {
  return [
    ...bar.querySelectorAll<HTMLElement>('[data-slot="tabs-trigger"]'),
  ].map((tab) => ({
    value: tab.dataset.value ?? "",
    label: (tab.textContent ?? "").trim(),
    icon: tab.querySelector("svg")?.outerHTML ?? null,
    active: tab.dataset.state === "active",
  }));
}

/** Follows the page's tab bar; `choose` opens a tab and scrolls to it. */
function useTabBar(
  anchor: React.RefObject<HTMLElement | null>,
  fallbackLook: string,
) {
  const [state, setState] = useState<State | null>(null);

  useEffect(() => {
    const doc = anchor.current?.ownerDocument;
    const win = doc?.defaultView;
    if (!doc || !win) return;
    const read = () => {
      const bar = visibleBar(doc);
      if (!bar) return setState(null);
      const top =
        doc.querySelector("[data-site-header]")?.getBoundingClientRect()
          .bottom ?? 0;
      const title = [...doc.querySelectorAll<HTMLElement>("h1")].find(
        (h1) => h1.getClientRects().length > 0,
      );
      const rect = bar.getBoundingClientRect();
      const where =
        rect.bottom <= top
          ? "above"
          : rect.top >= win.innerHeight - 40
            ? "below"
            : "in";
      const room = doc.documentElement.scrollHeight - win.innerHeight;
      setState({
        tabs: readTabs(bar),
        look:
          bar.closest<HTMLElement>("[data-phone-jump]")?.dataset.phoneJump ??
          fallbackLook,
        where,
        titlePassed: title
          ? title.getBoundingClientRect().bottom < top
          : win.scrollY > 200,
        top,
        progress: room > 0 ? Math.min(1, Math.max(0, win.scrollY / room)) : 0,
        scrollY: win.scrollY,
      });
    };
    let frame = 0;
    const later = () => {
      if (!frame)
        frame = win.requestAnimationFrame(() => ((frame = 0), read()));
    };
    const start = win.setTimeout(read, 500);
    win.addEventListener("scroll", later, { passive: true });
    win.addEventListener("resize", later);
    // A tab changed (from the page's own bar too), or a design was switched.
    const watch = new MutationObserver(later);
    watch.observe(doc.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-state", "data-phone-jump"],
    });
    return () => {
      win.clearTimeout(start);
      if (frame) win.cancelAnimationFrame(frame);
      win.removeEventListener("scroll", later);
      win.removeEventListener("resize", later);
      watch.disconnect();
    };
  }, [anchor, fallbackLook]);

  function choose(value: string, scroll = true) {
    const doc = anchor.current?.ownerDocument;
    const win = doc?.defaultView;
    const bar = doc ? visibleBar(doc) : null;
    if (!doc || !win || !bar) return;
    const trigger = [
      ...bar.querySelectorAll<HTMLElement>('[data-slot="tabs-trigger"]'),
    ].find((tab) => tab.dataset.value === value);
    // The tab bar changes tab on a press (mouse down), as when tapped.
    trigger?.dispatchEvent(
      new win.MouseEvent("mousedown", { bubbles: true, button: 0 }),
    );
    if (!scroll) return;
    const top =
      doc.querySelector("[data-site-header]")?.getBoundingClientRect().bottom ??
      0;
    win.scrollTo({
      top: bar.getBoundingClientRect().top + win.scrollY - top - 8,
      behavior: "smooth",
    });
  }

  return { state, choose };
}

/** A tab's own icon (copied from the tab bar). */
function TabIcon({ tab, className }: { tab: Tab; className?: string }) {
  if (!tab.icon) return null;
  return (
    <span
      aria-hidden
      className={cn("contents [&>svg]:size-5 [&>svg]:shrink-0", className)}
      dangerouslySetInnerHTML={{ __html: tab.icon }}
    />
  );
}

/** A dimmed screen behind a menu; tapping it closes the menu. */
function Dim({
  onClose,
  className,
}: {
  onClose: () => void;
  className?: string;
}) {
  return (
    <button
      aria-label="Close"
      className={cn(
        "fixed inset-0 z-[70] cursor-default bg-black/45",
        className,
      )}
      onClick={onClose}
      type="button"
    />
  );
}

/** A list of the tabs as rows: icon, name, a tick on the open one. */
function Rows({
  tabs,
  pick,
  dark = false,
  className,
}: {
  tabs: Tab[];
  pick: (tab: Tab) => void;
  dark?: boolean;
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-col gap-0.5", className)}>
      {tabs.map((tab) => (
        <li key={tab.value}>
          <button
            className={cn(
              "flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-left text-sm font-medium",
              dark
                ? tab.active
                  ? "bg-white/15"
                  : "hover:bg-white/10"
                : tab.active
                  ? "bg-muted"
                  : "hover:bg-muted",
            )}
            onClick={() => pick(tab)}
            type="button"
          >
            <TabIcon tab={tab} />
            <span className="min-w-0 flex-1">{tab.label}</span>
            {tab.active ? (
              <Check aria-hidden className="size-4 shrink-0" />
            ) : null}
          </button>
        </li>
      ))}
    </ul>
  );
}

/** The walk's live status line, for the sticky bar that carries it. */
function StatusLine({ parts }: { parts: WalkIdeaParts }) {
  const now = useWalkNow(parts.timing, parts.attended?.count ?? null);
  return (
    <div
      className={cn("flex items-center gap-2 px-4 py-1.5 text-xs", now.tone)}
    >
      <span
        className={cn(
          "size-2 rounded-full",
          now.live ? "bg-emerald-500" : "bg-zinc-400",
        )}
      />
      <span className="font-semibold">{now.eyebrow}</span>
      <span className="min-w-0 truncate">· {now.line}</span>
    </div>
  );
}

const BOTTOM = "bottom-[calc(16px+var(--bottom-nav-offset,0px))]";
const TOP_LOOKS = new Set([
  "sticky",
  "sticky-labels",
  "sticky-track",
  "sticky-green",
  "sticky-chips",
  "header",
  "sticky-line",
  "sticky-dark",
  "sticky-numbers",
  "sticky-status",
  "sticky-dropdown",
  "breadcrumb",
  "drill",
]);

/**
 * The floating way to the tabs (the Tabs block's Jump to tabs on phones):
 * phones and tablets only. Drawn once per page.
 */
export function TabJump() {
  const anchor = useRef<HTMLSpanElement>(null);
  const parts = useWalkParts();
  const { state, choose } = useTabBar(anchor, "sticky");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [toastGone, setToastGone] = useState(false);

  const look = state?.look ?? "sticky";

  const hold = <span hidden ref={anchor} />;
  if (!state || state.tabs.length === 0 || look === "none") return hold;
  const { tabs } = state;
  const index = Math.max(
    0,
    tabs.findIndex((tab) => tab.active),
  );
  const current = tabs[index];
  const pick = (tab: Tab) => {
    setOpen(false);
    choose(tab.value);
  };
  const step = (by: number) => {
    const next = tabs[index + by];
    if (next) choose(next.value);
  };
  const offScreen = state.where !== "in";
  const shown = TOP_LOOKS.has(look)
    ? state.titlePassed && offScreen
    : look === "bottom-bar"
      ? true
      : look === "toast"
        ? state.where === "below" && !toastGone && state.scrollY < 200
        : look === "more-below"
          ? state.where === "below" && state.scrollY < 40
          : offScreen || open;
  if (!shown) return hold;
  const title = parts?.headline.title ?? "";
  const day = parts ? formatWalkDay(new Date(parts.headline.startsAt)) : "";
  const topStyle = { top: state.top };
  const topBar =
    "fixed inset-x-0 z-[65] animate-in border-b bg-background/95 backdrop-blur fade-in-0 slide-in-from-top-2 lg:hidden";
  const iconTab = (tab: Tab, className?: string, extra?: ReactNode) => (
    <button
      aria-current={tab.active ? "true" : undefined}
      aria-label={tab.label}
      className={cn(
        "relative flex cursor-pointer touch-manipulation items-center justify-center",
        className,
      )}
      key={tab.value}
      onClick={() => choose(tab.value)}
      title={tab.label}
      type="button"
    >
      <TabIcon tab={tab} />
      {extra}
    </button>
  );
  const grid = {
    gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
  };
  const nameRow = (
    <div className="flex items-center justify-between gap-3 px-4 pt-2 text-xs">
      <span className="min-w-0 truncate font-semibold">{title}</span>
      <span className="shrink-0 text-muted-foreground">{day}</span>
    </div>
  );
  // A menu of the tabs; one that hangs under the header bar passes `below`.
  const listMenu = (className: string, below?: number) => (
    <>
      <Dim onClose={() => setOpen(false)} />
      <div
        className={cn(
          "fixed z-[71] animate-in fade-in-0 zoom-in-95 lg:hidden",
          className,
        )}
        style={below === undefined ? undefined : { top: below }}
      >
        <Rows pick={pick} tabs={tabs} />
      </div>
    </>
  );

  let body: ReactNode = null;
  switch (look) {
    // ── Bars under the header ──
    case "sticky":
      body = (
        <nav aria-label="Jump to a tab" className={topBar} style={topStyle}>
          {nameRow}
          <div className="grid px-2" style={grid}>
            {tabs.map((tab) =>
              iconTab(
                tab,
                cn(
                  "h-11 border-b-2",
                  tab.active
                    ? "border-foreground"
                    : "border-transparent text-muted-foreground",
                ),
              ),
            )}
          </div>
        </nav>
      );
      break;
    case "sticky-labels":
    case "sticky-numbers":
      body = (
        <nav aria-label="Jump to a tab" className={topBar} style={topStyle}>
          <div className="grid px-1" style={grid}>
            {tabs.map((tab, i) => (
              <button
                className={cn(
                  "relative flex cursor-pointer flex-col items-center gap-1 border-b-2 px-0.5 pt-2.5 pb-2 text-[10px] font-medium",
                  tab.active
                    ? "border-foreground"
                    : "border-transparent text-muted-foreground",
                )}
                key={tab.value}
                onClick={() => choose(tab.value)}
                type="button"
              >
                <TabIcon tab={tab} />
                <span className="w-full truncate text-center">{tab.label}</span>
                {look === "sticky-numbers" ? (
                  <span className="absolute top-1 left-[calc(50%+6px)] flex size-4 items-center justify-center rounded-full border-2 border-background bg-emerald-700 text-[8px] font-bold text-white">
                    {i + 1}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </nav>
      );
      break;
    case "sticky-track":
      body = (
        <nav
          aria-label="Jump to a tab"
          className={cn(topBar, "px-3 py-2")}
          style={topStyle}
        >
          <div className="grid gap-0.5 rounded-xl bg-muted p-0.5" style={grid}>
            {tabs.map((tab) =>
              iconTab(
                tab,
                cn(
                  "h-9 rounded-[10px]",
                  tab.active
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground",
                ),
              ),
            )}
          </div>
        </nav>
      );
      break;
    case "sticky-green":
      body = (
        <nav
          aria-label="Jump to a tab"
          className={cn(
            topBar,
            "flex items-center justify-between gap-1 px-3 py-2",
          )}
          style={topStyle}
        >
          {tabs.map((tab) =>
            tab.active ? (
              <button
                className="flex h-10 min-w-0 cursor-pointer items-center gap-2 rounded-full bg-emerald-700 px-4 text-sm font-semibold text-white"
                key={tab.value}
                onClick={() => choose(tab.value)}
                type="button"
              >
                <TabIcon tab={tab} className="[&>svg]:size-4" />
                <span className="truncate">{tab.label}</span>
              </button>
            ) : (
              iconTab(
                tab,
                "size-10 shrink-0 rounded-full text-muted-foreground",
              )
            ),
          )}
        </nav>
      );
      break;
    case "sticky-chips":
      body = (
        <nav
          aria-label="Jump to a tab"
          className={cn(
            topBar,
            "flex gap-2 overflow-x-auto px-3 py-2.5 [scrollbar-width:none]",
          )}
          style={topStyle}
        >
          {tabs.map((tab) => (
            <button
              className={cn(
                "flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium whitespace-nowrap",
                tab.active
                  ? "border-foreground bg-foreground text-background"
                  : "text-foreground/80",
              )}
              key={tab.value}
              onClick={() => choose(tab.value)}
              type="button"
            >
              <TabIcon tab={tab} className="[&>svg]:size-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      );
      break;
    case "header":
      body = (
        <nav
          aria-label="Jump to a tab"
          className="fixed inset-x-0 top-0 z-[67] flex animate-in items-center gap-1 border-b bg-background px-2 fade-in-0 lg:hidden"
          style={{ height: Math.max(state.top, 56) }}
        >
          <button
            aria-label="Back to the top of the walk"
            className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-muted"
            onClick={() =>
              anchor.current?.ownerDocument.defaultView?.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
            type="button"
          >
            <ChevronUp className="size-5" />
          </button>
          <div className="grid flex-1" style={grid}>
            {tabs.map((tab) =>
              iconTab(
                tab,
                cn(
                  "h-12 flex-col gap-1",
                  tab.active ? "" : "text-muted-foreground",
                ),
                <span
                  className={cn(
                    "size-1 rounded-full",
                    tab.active ? "bg-emerald-600" : "bg-transparent",
                  )}
                />,
              ),
            )}
          </div>
        </nav>
      );
      break;
    case "sticky-line":
      body = (
        <nav aria-label="Jump to a tab" className={topBar} style={topStyle}>
          <div className="flex items-center justify-between px-4 pt-2 text-xs">
            <span className="min-w-0 truncate font-semibold">{title}</span>
            <span className="shrink-0 text-muted-foreground">
              {index + 1} of {tabs.length}
            </span>
          </div>
          <div className="grid px-2" style={grid}>
            {tabs.map((tab, i) =>
              i < index ? (
                <button
                  aria-label={tab.label}
                  className="flex h-11 cursor-pointer items-center justify-center text-emerald-700"
                  key={tab.value}
                  onClick={() => choose(tab.value)}
                  type="button"
                >
                  <Check className="size-5" />
                </button>
              ) : (
                iconTab(
                  tab,
                  cn("h-11", tab.active ? "" : "text-muted-foreground"),
                )
              ),
            )}
          </div>
          <div className="h-[3px] bg-muted">
            <div
              className="h-full bg-emerald-700"
              style={{ width: `${Math.round(state.progress * 100)}%` }}
            />
          </div>
        </nav>
      );
      break;
    case "sticky-dark":
      body = (
        <nav
          aria-label="Jump to a tab"
          className="fixed inset-x-3 z-[65] animate-in rounded-2xl bg-zinc-950 p-2 text-white shadow-xl fade-in-0 slide-in-from-top-2 lg:hidden"
          style={{ top: state.top + 8 }}
        >
          <div className="flex items-center justify-between px-2 pb-1 text-xs">
            <span className="min-w-0 truncate font-semibold">{title}</span>
            <span className="text-zinc-400">{day}</span>
          </div>
          <div className="grid gap-1" style={grid}>
            {tabs.map((tab) =>
              iconTab(
                tab,
                cn(
                  "h-10 rounded-[10px]",
                  tab.active ? "bg-white text-zinc-950" : "text-zinc-400",
                ),
              ),
            )}
          </div>
        </nav>
      );
      break;
    case "sticky-status":
      body = (
        <nav aria-label="Jump to a tab" className={topBar} style={topStyle}>
          {parts ? <StatusLine parts={parts} /> : null}
          <div className="grid px-2" style={grid}>
            {tabs.map((tab) =>
              iconTab(
                tab,
                cn(
                  "h-11 border-b-2",
                  tab.active
                    ? "border-foreground"
                    : "border-transparent text-muted-foreground",
                ),
              ),
            )}
          </div>
        </nav>
      );
      break;
    case "sticky-dropdown":
    case "breadcrumb":
      body = (
        <>
          <nav
            aria-label="Jump to a tab"
            className={cn(
              topBar,
              "flex items-center justify-between gap-3 px-4 py-2",
            )}
            style={topStyle}
          >
            {look === "breadcrumb" ? (
              <span className="flex min-w-0 items-center gap-1 text-[13px] text-muted-foreground">
                <span className="min-w-0 truncate">{title}</span>
                <ChevronRight className="size-3.5 shrink-0" />
              </span>
            ) : (
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[11px] text-muted-foreground">
                  {title}
                </span>
                <span className="truncate text-[15px] font-semibold">
                  {current.label}
                </span>
              </span>
            )}
            <button
              className="flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-[10px] border bg-muted px-3 text-[13px] font-semibold"
              onClick={() => setOpen(!open)}
              type="button"
            >
              {look === "breadcrumb" ? (
                <>
                  <TabIcon tab={current} className="[&>svg]:size-4" />
                  {current.label}
                </>
              ) : (
                "Sections"
              )}
              {open ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </button>
          </nav>
          {open
            ? listMenu(
                "right-4 w-60 rounded-2xl border bg-popover p-1.5 shadow-xl",
                state.top + 64,
              )
            : null}
        </>
      );
      break;
    case "drill":
      body = (
        <>
          <nav
            aria-label="Jump to a tab"
            className={cn(topBar, "flex h-14 items-center px-2")}
            style={topStyle}
          >
            <button
              className="flex h-11 cursor-pointer items-center gap-0.5 rounded-[10px] px-2 text-[15px] font-medium text-emerald-700"
              onClick={() =>
                anchor.current?.ownerDocument.defaultView?.scrollTo({
                  top: 0,
                  behavior: "smooth",
                })
              }
              type="button"
            >
              <ChevronLeft className="size-5" />
              Walk
            </button>
            <span className="min-w-0 flex-1 truncate pr-16 text-center font-semibold">
              {current.label}
            </span>
          </nav>
          <div
            className={cn(
              "fixed inset-x-4 z-[56] grid grid-cols-2 gap-2 lg:hidden",
              BOTTOM,
            )}
          >
            <button
              className="flex h-12 cursor-pointer items-center gap-1.5 rounded-xl border bg-background px-3 text-[13px] text-muted-foreground disabled:opacity-40"
              disabled={index === 0}
              onClick={() => step(-1)}
              type="button"
            >
              <ChevronLeft className="size-4" />
              <span className="truncate">{tabs[index - 1]?.label ?? ""}</span>
            </button>
            <button
              className="flex h-12 cursor-pointer items-center justify-end gap-1.5 rounded-xl border bg-background px-3 text-[13px] font-semibold disabled:opacity-40"
              disabled={index === tabs.length - 1}
              onClick={() => step(1)}
              type="button"
            >
              <span className="truncate">{tabs[index + 1]?.label ?? ""}</span>
              <ChevronRight className="size-4" />
            </button>
          </div>
        </>
      );
      break;

    // ── Buttons and menus ──
    case "round":
    case "tabs-button":
      body = (
        <>
          {open
            ? listMenu(
                "right-4 bottom-[calc(88px+var(--bottom-nav-offset,0px))] w-64 rounded-2xl border bg-popover p-1.5 shadow-xl",
              )
            : null}
          <button
            aria-label="Jump to a tab"
            className={cn(
              "fixed right-4 z-[72] flex cursor-pointer items-center justify-center gap-2 text-white shadow-lg lg:hidden",
              BOTTOM,
              look === "round"
                ? "size-14 rounded-full bg-zinc-950"
                : "h-12 rounded-full bg-emerald-700 pr-4 pl-3.5 text-[15px] font-semibold",
            )}
            onClick={() => setOpen(!open)}
            type="button"
          >
            {open ? (
              <X className="size-5" />
            ) : (
              <LayoutList className="size-5" />
            )}
            {look === "tabs-button" ? (
              <>
                Tabs
                <span className="flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-white/20 text-xs">
                  {tabs.length}
                </span>
              </>
            ) : null}
          </button>
        </>
      );
      break;
    case "speed-dial":
    case "arc":
      body = (
        <>
          {open ? (
            <>
              <Dim onClose={() => setOpen(false)} />
              {look === "speed-dial" ? (
                <div className="fixed right-4 bottom-[calc(92px+var(--bottom-nav-offset,0px))] z-[71] flex flex-col items-end gap-3 lg:hidden">
                  {[...tabs].reverse().map((tab) => (
                    <button
                      className="flex cursor-pointer items-center gap-2.5"
                      key={tab.value}
                      onClick={() => pick(tab)}
                      type="button"
                    >
                      <span className="rounded-lg bg-background px-2.5 py-1.5 text-[13px] font-medium shadow-md">
                        {tab.label}
                      </span>
                      <span
                        className={cn(
                          "flex size-12 items-center justify-center rounded-full shadow-md",
                          tab.active
                            ? "bg-emerald-700 text-white"
                            : "bg-background",
                        )}
                      >
                        <TabIcon tab={tab} />
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="fixed inset-x-0 bottom-[calc(24px+var(--bottom-nav-offset,0px))] z-[71] h-[180px] lg:hidden">
                  {tabs.map((tab, i) => {
                    const angle =
                      Math.PI - (Math.PI * i) / Math.max(1, tabs.length - 1);
                    return (
                      <button
                        className="absolute flex w-[72px] -translate-x-1/2 cursor-pointer flex-col items-center gap-1 text-[11px] font-medium text-white"
                        key={tab.value}
                        onClick={() => pick(tab)}
                        style={{
                          left: `calc(50% + ${Math.cos(angle) * 125}px)`,
                          bottom: 30 + Math.sin(angle) * 120,
                        }}
                        type="button"
                      >
                        <span
                          className={cn(
                            "flex size-[52px] items-center justify-center rounded-full shadow-lg",
                            tab.active
                              ? "bg-emerald-700"
                              : "bg-background text-foreground",
                          )}
                        >
                          <TabIcon tab={tab} />
                        </span>
                        <span className="w-full truncate text-center">
                          {tab.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          ) : null}
          <button
            aria-label={open ? "Close" : "Jump to a tab"}
            className={cn(
              "fixed z-[72] flex size-14 cursor-pointer items-center justify-center rounded-full bg-zinc-950 text-white shadow-lg lg:hidden",
              BOTTOM,
              look === "arc" ? "left-1/2 -translate-x-1/2" : "right-4",
            )}
            onClick={() => setOpen(!open)}
            type="button"
          >
            {open ? (
              <X className="size-6" />
            ) : (
              <LayoutList className="size-6" />
            )}
          </button>
        </>
      );
      break;
    case "peek":
    case "glass":
    case "segmented":
      body = (
        <nav
          aria-label="Jump to a tab"
          className={cn(
            "fixed z-[56] animate-in fade-in-0 slide-in-from-bottom-2 lg:hidden",
            BOTTOM,
            look === "peek" &&
              "inset-x-3 rounded-2xl border bg-background/95 p-1.5 shadow-lg",
            look === "glass" &&
              "left-1/2 flex -translate-x-1/2 gap-1 rounded-full border border-white/80 bg-white/70 p-1.5 shadow-xl backdrop-blur-xl dark:bg-zinc-900/70",
            look === "segmented" &&
              "inset-x-3 rounded-2xl border bg-background p-2 shadow-md",
          )}
        >
          {look === "peek" ? (
            <>
              <span className="mx-auto mb-1 block h-1 w-9 rounded-full bg-zinc-300" />
              <div className="grid gap-1" style={grid}>
                {tabs.map((tab) => (
                  <button
                    className={cn(
                      "flex h-[52px] cursor-pointer flex-col items-center justify-center gap-1 rounded-[10px] px-0.5 text-[11px]",
                      tab.active
                        ? "bg-muted font-semibold"
                        : "font-medium text-foreground/75",
                    )}
                    key={tab.value}
                    onClick={() => choose(tab.value)}
                    type="button"
                  >
                    <TabIcon tab={tab} />
                    <span className="w-full truncate text-center">
                      {tab.label}
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : look === "glass" ? (
            tabs.map((tab) =>
              iconTab(
                tab,
                cn(
                  "size-12 rounded-full",
                  tab.active ? "bg-zinc-950 text-white" : "text-foreground/80",
                ),
              ),
            )
          ) : (
            <div className="grid rounded-xl bg-muted p-0.5" style={grid}>
              {tabs.map((tab) => (
                <button
                  className={cn(
                    "h-9 cursor-pointer truncate rounded-[10px] px-1 text-xs font-semibold",
                    tab.active
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground",
                  )}
                  key={tab.value}
                  onClick={() => choose(tab.value)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </nav>
      );
      break;
    case "ring": {
      const around = 2 * Math.PI * 28;
      const next = tabs[index + 1] ?? current;
      body = (
        <>
          {open
            ? listMenu(
                "right-4 bottom-[calc(96px+var(--bottom-nav-offset,0px))] w-64 rounded-2xl border bg-popover p-1.5 shadow-xl",
              )
            : null}
          <div
            className={cn(
              "fixed right-3 z-[72] flex items-center gap-2.5 lg:hidden",
              BOTTOM,
            )}
          >
            {!open ? (
              <span className="rounded-full bg-zinc-950 px-3 py-2 text-[13px] font-medium text-white shadow-md">
                Next: {next.label}
              </span>
            ) : null}
            <button
              aria-label="Jump to a tab"
              className="relative flex size-16 cursor-pointer items-center justify-center rounded-full bg-background shadow-lg"
              onClick={() => setOpen(!open)}
              type="button"
            >
              <svg aria-hidden className="absolute inset-0" viewBox="0 0 64 64">
                <circle
                  cx="32"
                  cy="32"
                  fill="none"
                  r="28"
                  stroke="#e4e4e7"
                  strokeWidth="4"
                />
                <circle
                  cx="32"
                  cy="32"
                  fill="none"
                  r="28"
                  stroke="#2e7d5b"
                  strokeDasharray={`${state.progress * around} ${around}`}
                  strokeLinecap="round"
                  strokeWidth="4"
                  transform="rotate(-90 32 32)"
                />
              </svg>
              <span className="flex size-12 items-center justify-center rounded-full bg-zinc-950 text-white">
                {open ? <X className="size-5" /> : <TabIcon tab={next} />}
              </span>
            </button>
          </div>
        </>
      );
      break;
    }
    case "sheet":
    case "swipe-handle":
      body = open ? (
        <>
          <Dim onClose={() => setOpen(false)} />
          <section className="fixed inset-x-0 bottom-0 z-[71] flex animate-in flex-col gap-3 rounded-t-[20px] bg-background px-4 pt-2.5 pb-6 shadow-2xl slide-in-from-bottom-10 lg:hidden">
            <span className="mx-auto block h-[5px] w-10 rounded-full bg-zinc-300" />
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Jump to</h2>
              <button
                aria-label="Close"
                className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-muted"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {tabs.map((tab, i) => (
                <button
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-[14px] border p-3 text-left",
                    tab.active && "bg-muted",
                  )}
                  key={tab.value}
                  onClick={() => pick(tab)}
                  type="button"
                >
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-[10px]",
                      PASTELS[i % PASTELS.length],
                    )}
                  >
                    <TabIcon tab={tab} />
                  </span>
                  <span className="min-w-0 flex-1 text-[15px] font-semibold">
                    {tab.label}
                  </span>
                  {tab.active ? (
                    <span className="text-xs font-semibold text-emerald-700">
                      Open
                    </span>
                  ) : (
                    <ChevronRight className="size-4 text-muted-foreground" />
                  )}
                </button>
              ))}
            </div>
          </section>
        </>
      ) : look === "swipe-handle" ? (
        <button
          className="fixed inset-x-0 bottom-[var(--bottom-nav-offset,0px)] z-[56] flex h-16 cursor-pointer flex-col items-center justify-center gap-2 rounded-t-[20px] border-t bg-background shadow-[0_-8px_24px_rgb(0_0_0/0.1)] lg:hidden"
          onClick={() => setOpen(true)}
          type="button"
        >
          <span className="h-[5px] w-10 rounded-full bg-zinc-300" />
          <span className="flex items-center gap-2.5 text-sm font-semibold">
            <span className="flex gap-1.5 text-muted-foreground">
              {tabs.map((tab) => (
                <TabIcon className="[&>svg]:size-4" key={tab.value} tab={tab} />
              ))}
            </span>
            Swipe up for this walk&apos;s tabs
          </span>
        </button>
      ) : (
        <button
          aria-label="Jump to a tab"
          className={cn(
            "fixed right-4 z-[56] flex size-14 cursor-pointer items-center justify-center rounded-full bg-zinc-950 text-white shadow-lg lg:hidden",
            BOTTOM,
          )}
          onClick={() => setOpen(true)}
          type="button"
        >
          <LayoutList className="size-6" />
        </button>
      );
      break;
    case "top-pill":
      body = (
        <>
          {open ? (
            <Dim onClose={() => setOpen(false)} className="bg-black/35" />
          ) : null}
          <div
            className="fixed left-1/2 z-[71] w-[300px] max-w-[calc(100%-32px)] -translate-x-1/2 rounded-[22px] bg-zinc-950 p-2 text-white shadow-xl lg:hidden"
            style={{ top: state.top + 12 }}
          >
            <button
              className="flex w-full cursor-pointer items-center justify-between px-2.5 py-1.5 text-[13px] text-zinc-400"
              onClick={() => setOpen(!open)}
              type="button"
            >
              <span>
                You&apos;re on:{" "}
                <span className="font-semibold text-white">
                  {current.label}
                </span>
              </span>
              {open ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </button>
            {open ? <Rows dark pick={pick} tabs={tabs} /> : null}
          </div>
        </>
      );
      break;
    case "rail":
    case "ladder":
      body = (
        <nav
          aria-label="Jump to a tab"
          className={cn(
            "fixed top-1/3 z-[56] flex flex-col items-center rounded-full border bg-background/95 p-1 shadow-lg lg:hidden",
            look === "rail" ? "right-2 gap-0.5" : "left-1.5 py-2.5",
          )}
        >
          {tabs.map((tab, i) =>
            look === "rail" ? (
              iconTab(
                tab,
                cn(
                  "size-11 rounded-full",
                  tab.active
                    ? "bg-zinc-950 text-white"
                    : "text-muted-foreground",
                ),
              )
            ) : (
              <span className="flex flex-col items-center" key={tab.value}>
                {i > 0 ? (
                  <span
                    className={cn(
                      "h-3.5 w-0.5",
                      i <= index ? "bg-emerald-700" : "bg-border",
                    )}
                  />
                ) : null}
                <button
                  aria-label={tab.label}
                  className="flex size-11 cursor-pointer items-center justify-center"
                  onClick={() => choose(tab.value)}
                  title={tab.label}
                  type="button"
                >
                  {tab.active ? (
                    <span className="flex size-[30px] items-center justify-center rounded-full bg-emerald-700 text-white">
                      <TabIcon tab={tab} className="[&>svg]:size-4" />
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "size-3.5 rounded-full",
                        i < index
                          ? "bg-emerald-700"
                          : "border-2 border-zinc-300",
                      )}
                    />
                  )}
                </button>
              </span>
            ),
          )}
        </nav>
      );
      break;
    case "stepper":
    case "corner":
      body =
        look === "stepper" ? (
          <div
            className={cn(
              "fixed inset-x-4 z-[56] flex h-14 items-center justify-between rounded-full bg-zinc-950 px-1.5 text-white shadow-xl lg:hidden",
              BOTTOM,
            )}
          >
            <button
              aria-label="Previous tab"
              className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-zinc-800 disabled:opacity-30"
              disabled={index === 0}
              onClick={() => step(-1)}
              type="button"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              className="flex min-w-0 cursor-pointer flex-col items-center gap-1"
              onClick={() => choose(current.value)}
              type="button"
            >
              <span className="flex max-w-full items-center gap-1.5 truncate text-sm font-semibold">
                <TabIcon tab={current} className="[&>svg]:size-4" />
                {current.label}
              </span>
              <span className="flex gap-1">
                {tabs.map((tab) => (
                  <span
                    className={cn(
                      "h-1.5 rounded-full",
                      tab.active ? "w-3.5 bg-white" : "w-1.5 bg-zinc-500",
                    )}
                    key={tab.value}
                  />
                ))}
              </span>
            </button>
            <button
              aria-label="Next tab"
              className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-zinc-800 disabled:opacity-30"
              disabled={index === tabs.length - 1}
              onClick={() => step(1)}
              type="button"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        ) : (
          <div
            className={cn(
              "fixed right-4 z-[56] w-44 overflow-hidden rounded-2xl border bg-background shadow-xl lg:hidden",
              BOTTOM,
            )}
          >
            <button
              className="flex h-10 w-full cursor-pointer items-center gap-2 border-b px-3 text-xs text-muted-foreground disabled:opacity-40"
              disabled={index === 0}
              onClick={() => step(-1)}
              type="button"
            >
              <ChevronUp className="size-4" />
              <span className="truncate">
                {tabs[index - 1]?.label ?? "Top"}
              </span>
            </button>
            <button
              className="flex h-[52px] w-full cursor-pointer items-center gap-2.5 bg-zinc-950 px-3 text-left text-white"
              onClick={() => choose(current.value)}
              type="button"
            >
              <TabIcon tab={current} />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold">
                  {current.label}
                </span>
                <span className="text-[11px] text-zinc-400">
                  {index + 1} of {tabs.length}
                </span>
              </span>
            </button>
            <button
              className="flex h-10 w-full cursor-pointer items-center gap-2 px-3 text-xs text-muted-foreground disabled:opacity-40"
              disabled={index === tabs.length - 1}
              onClick={() => step(1)}
              type="button"
            >
              <ChevronDown className="size-4" />
              <span className="truncate">{tabs[index + 1]?.label ?? ""}</span>
            </button>
          </div>
        );
      break;
    case "grid":
    case "big-menu":
      body = (
        <>
          {open ? (
            <div
              className={cn(
                "fixed inset-0 z-[71] flex animate-in flex-col gap-5 p-6 fade-in-0 lg:hidden",
                look === "grid"
                  ? "bg-zinc-50/97 dark:bg-zinc-950/97"
                  : "bg-emerald-950 text-white",
              )}
              style={{ paddingTop: state.top + 24 }}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block truncate text-[13px]",
                      look === "grid"
                        ? "text-muted-foreground"
                        : "text-emerald-200",
                    )}
                  >
                    {title}
                  </span>
                  {look === "grid" ? (
                    <span className="text-[26px] font-bold">Jump to</span>
                  ) : null}
                </span>
                <button
                  aria-label="Close"
                  className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-black/10 dark:bg-white/15"
                  onClick={() => setOpen(false)}
                  type="button"
                >
                  <X className="size-5" />
                </button>
              </div>
              {look === "grid" ? (
                <div className="grid grid-cols-2 gap-3">
                  {tabs.map((tab, i) => (
                    <button
                      className={cn(
                        "flex h-[120px] cursor-pointer flex-col items-start justify-between rounded-[18px] bg-background p-4 text-left",
                        tab.active ? "border-2 border-foreground" : "border",
                      )}
                      key={tab.value}
                      onClick={() => pick(tab)}
                      type="button"
                    >
                      <span
                        className={cn(
                          "flex size-10 items-center justify-center rounded-xl",
                          PASTELS[i % PASTELS.length],
                        )}
                      >
                        <TabIcon tab={tab} />
                      </span>
                      <span className="text-[15px] font-semibold">
                        {tab.label}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <nav className="flex flex-col gap-1.5">
                  {tabs.map((tab) => (
                    <button
                      className={cn(
                        "cursor-pointer text-left text-[40px] leading-[1.15] font-extrabold tracking-tight",
                        tab.active ? "text-white" : "text-emerald-300",
                      )}
                      key={tab.value}
                      onClick={() => pick(tab)}
                      type="button"
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              )}
            </div>
          ) : null}
          <button
            aria-label="Jump to a tab"
            className={cn(
              "fixed right-4 z-[56] flex size-14 cursor-pointer items-center justify-center rounded-full bg-zinc-950 text-white shadow-lg lg:hidden",
              BOTTOM,
            )}
            onClick={() => setOpen(true)}
            type="button"
          >
            <LayoutList className="size-6" />
          </button>
        </>
      );
      break;
    case "bottom-bar":
      body = (
        <nav
          aria-label="This walk"
          className="fixed inset-x-0 bottom-0 z-[58] grid border-t bg-background pb-[env(safe-area-inset-bottom)] lg:hidden"
          style={{
            gridTemplateColumns: `repeat(${tabs.length + 1}, minmax(0, 1fr))`,
          }}
        >
          <a
            className="flex h-16 flex-col items-center justify-center gap-0.5 bg-muted text-[10px] text-muted-foreground"
            href="/walks"
          >
            <ChevronLeft className="size-5" />
            Walks
          </a>
          {tabs.map((tab) => (
            <button
              className={cn(
                "flex h-16 cursor-pointer flex-col items-center justify-center gap-0.5 px-0.5 text-[10px]",
                tab.active
                  ? "font-semibold text-emerald-700"
                  : "text-muted-foreground",
              )}
              key={tab.value}
              onClick={() => choose(tab.value)}
              type="button"
            >
              <TabIcon tab={tab} />
              <span className="w-full truncate text-center">{tab.label}</span>
            </button>
          ))}
        </nav>
      );
      break;
    case "expand-pill":
      body = (
        <div
          className={cn(
            "fixed left-1/2 z-[56] w-[260px] -translate-x-1/2 rounded-[26px] bg-zinc-950 p-2 text-white shadow-xl lg:hidden",
            BOTTOM,
          )}
        >
          {open ? (
            <Rows dark pick={pick} tabs={tabs.filter((tab) => !tab.active)} />
          ) : null}
          <button
            className="flex h-11 w-full cursor-pointer items-center gap-2.5 rounded-2xl bg-zinc-800 px-3 text-sm font-semibold"
            onClick={() => setOpen(!open)}
            type="button"
          >
            <TabIcon tab={current} className="[&>svg]:size-[18px]" />
            <span className="min-w-0 flex-1 truncate text-left">
              {current.label}
            </span>
            {open ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronUp className="size-4" />
            )}
          </button>
        </div>
      );
      break;
    case "wheel":
      body = (
        <>
          {open ? (
            <>
              <Dim onClose={() => setOpen(false)} />
              <div className="fixed -right-[200px] -bottom-[136px] z-[71] size-[400px] rounded-full bg-background shadow-2xl lg:hidden">
                {tabs.map((tab, i) => {
                  const angle =
                    (Math.PI *
                      (190 + (60 * i) / Math.max(1, tabs.length - 1))) /
                    180;
                  return (
                    <button
                      aria-label={tab.label}
                      className={cn(
                        "absolute flex size-12 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full",
                        tab.active
                          ? "bg-emerald-700 text-white"
                          : "text-foreground/80",
                      )}
                      key={tab.value}
                      onClick={() => pick(tab)}
                      style={{
                        left: 200 + Math.cos(angle) * 160,
                        top: 200 + Math.sin(angle) * 160,
                      }}
                      type="button"
                    >
                      <TabIcon tab={tab} />
                    </button>
                  );
                })}
                <span className="absolute top-[176px] left-[100px] w-24 text-[13px] leading-tight font-semibold">
                  {current.label}
                </span>
              </div>
            </>
          ) : null}
          <button
            aria-label={open ? "Close" : "Jump to a tab"}
            className={cn(
              "fixed right-3 z-[72] flex size-12 cursor-pointer items-center justify-center rounded-full bg-zinc-950 text-white shadow-lg lg:hidden",
              BOTTOM,
            )}
            onClick={() => setOpen(!open)}
            type="button"
          >
            {open ? (
              <X className="size-5" />
            ) : (
              <LayoutList className="size-5" />
            )}
          </button>
        </>
      );
      break;
    case "search": {
      const found = tabs.filter((tab) =>
        tab.label.toLowerCase().includes(query.trim().toLowerCase()),
      );
      body = open ? (
        <>
          <Dim onClose={() => setOpen(false)} />
          <div
            className="fixed inset-x-3 z-[71] overflow-hidden rounded-[18px] bg-background shadow-2xl lg:hidden"
            style={{ top: state.top + 16 }}
          >
            <label className="flex h-14 items-center gap-2.5 border-b px-4 text-muted-foreground">
              <Search className="size-5" />
              <input
                aria-label="Find a tab"
                autoFocus
                className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Find on this walk"
                value={query}
              />
              <button
                className="cursor-pointer rounded-md bg-muted px-2 py-1 text-xs"
                onClick={() => setOpen(false)}
                type="button"
              >
                Cancel
              </button>
            </label>
            <Rows
              className="p-2"
              pick={pick}
              tabs={found.length ? found : tabs}
            />
          </div>
        </>
      ) : (
        <button
          className={cn(
            "fixed right-4 z-[56] flex h-12 cursor-pointer items-center gap-2 rounded-full bg-zinc-950 pr-4 pl-3.5 text-sm font-semibold text-white shadow-lg lg:hidden",
            BOTTOM,
          )}
          onClick={() => setOpen(true)}
          type="button"
        >
          <Search className="size-[18px]" />
          Find on this walk
        </button>
      );
      break;
    }
    case "sections":
      body = (
        <>
          <button
            className="fixed right-4 z-[65] flex h-10 cursor-pointer items-center gap-1.5 rounded-full bg-zinc-950 px-3 text-[13px] font-semibold text-white shadow-md lg:hidden"
            onClick={() => setOpen(!open)}
            style={{ top: state.top + 8 }}
            type="button"
          >
            <LayoutList className="size-4" />
            Sections
          </button>
          {open
            ? listMenu(
                "right-4 w-64 rounded-2xl border bg-popover p-1.5 shadow-xl",
                state.top + 56,
              )
            : null}
        </>
      );
      break;
    case "drawer":
      body = open ? (
        <>
          <Dim onClose={() => setOpen(false)} />
          <aside
            className="fixed inset-y-0 left-0 z-[71] flex w-[300px] max-w-[85%] animate-in flex-col gap-4 bg-background p-4 shadow-2xl slide-in-from-left-10 lg:hidden"
            style={{ paddingTop: state.top + 20 }}
          >
            <span className="flex flex-col gap-1">
              <span className="text-xl leading-tight font-bold">{title}</span>
              <span className="text-[13px] text-muted-foreground">{day}</span>
            </span>
            <Rows pick={pick} tabs={tabs} />
          </aside>
        </>
      ) : (
        <button
          aria-label="Jump to a tab"
          className={cn(
            "fixed left-0 z-[56] flex h-24 w-7 cursor-pointer items-center justify-center rounded-r-[14px] bg-zinc-950/85 text-white top-1/2 -translate-y-1/2 lg:hidden",
          )}
          onClick={() => setOpen(true)}
          type="button"
        >
          <ChevronRight className="size-[18px]" />
        </button>
      );
      break;
    case "edges":
      body = (
        <>
          {index > 0 ? (
            <button
              aria-label={`Previous tab: ${tabs[index - 1].label}`}
              className="fixed top-1/2 left-0 z-[56] flex h-24 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-r-[14px] bg-zinc-950/75 text-white lg:hidden"
              onClick={() => step(-1)}
              type="button"
            >
              <ChevronLeft className="size-[18px]" />
            </button>
          ) : null}
          {index < tabs.length - 1 ? (
            <button
              className="fixed top-1/2 right-0 z-[56] flex h-24 -translate-y-1/2 cursor-pointer items-center gap-1.5 rounded-l-[14px] bg-zinc-950 pr-2.5 pl-3 text-xs font-semibold text-white lg:hidden"
              onClick={() => step(1)}
              type="button"
            >
              <span className="flex flex-col items-end">
                <span className="text-[10px] font-medium text-zinc-400">
                  Next
                </span>
                {tabs[index + 1].label}
              </span>
              <ChevronRight className="size-[18px]" />
            </button>
          ) : null}
        </>
      );
      break;
    case "folders":
      body = (
        <nav
          aria-label="Jump to a tab"
          className="fixed top-1/3 right-0 z-[56] flex flex-col items-end gap-1.5 lg:hidden"
        >
          {tabs.map((tab, i) => (
            <button
              aria-label={tab.label}
              className={cn(
                "flex h-[52px] cursor-pointer items-center gap-2 rounded-l-xl shadow-md",
                tab.active
                  ? cn(
                      "w-[132px] pl-3.5 text-[13px] font-semibold",
                      SOLIDS[(i % (SOLIDS.length - 1)) + 1],
                    )
                  : cn("w-11 justify-center", PASTELS[i % PASTELS.length]),
              )}
              key={tab.value}
              onClick={() => choose(tab.value)}
              type="button"
            >
              <TabIcon tab={tab} />
              {tab.active ? (
                <span className="truncate">{tab.label}</span>
              ) : null}
            </button>
          ))}
        </nav>
      );
      break;
    case "dock":
      body = (
        <nav
          aria-label="Jump to a tab"
          className={cn(
            "fixed left-1/2 z-[56] flex h-[72px] -translate-x-1/2 items-end gap-2 rounded-[22px] border bg-background/85 px-2.5 pb-2 shadow-xl backdrop-blur lg:hidden",
            BOTTOM,
          )}
        >
          {tabs.map((tab, i) => {
            const distance = Math.abs(i - index);
            return iconTab(
              tab,
              cn(
                "rounded-xl transition-all",
                distance === 0
                  ? cn(
                      "-mt-5 size-[68px] rounded-[18px] shadow-lg [&_svg]:size-7",
                      SOLIDS[(i % (SOLIDS.length - 1)) + 1],
                    )
                  : distance === 1
                    ? cn("size-[54px]", PASTELS[i % PASTELS.length])
                    : cn("size-11", PASTELS[i % PASTELS.length]),
              ),
            );
          })}
        </nav>
      );
      break;
    case "toast":
      body = (
        <div
          role="status"
          className={cn(
            "fixed inset-x-4 z-[56] flex animate-in items-start gap-3 rounded-2xl border bg-background p-3.5 shadow-xl fade-in-0 slide-in-from-bottom-4 lg:hidden",
            BOTTOM,
          )}
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-900">
            <ChevronDown className="size-5" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="text-sm font-semibold">
              There&apos;s more about this walk below
            </span>
            <span className="text-[13px] text-muted-foreground">
              {tabs.map((tab) => tab.label).join(", ")}
            </span>
            <span className="flex gap-2">
              <button
                className="h-9 cursor-pointer rounded-[10px] bg-zinc-950 px-3.5 text-[13px] font-semibold text-white"
                onClick={() => (setToastGone(true), choose(current.value))}
                type="button"
              >
                Show me
              </button>
              <button
                className="h-9 cursor-pointer rounded-[10px] bg-muted px-3.5 text-[13px] font-semibold"
                onClick={() => setToastGone(true)}
                type="button"
              >
                Not now
              </button>
            </span>
          </div>
        </div>
      );
      break;
    case "bubble":
      body = (
        <>
          <span
            aria-hidden
            className="fixed top-24 right-1 bottom-24 z-[56] w-1 rounded-full bg-muted lg:hidden"
          />
          <button
            className="fixed right-4 z-[56] flex cursor-pointer items-center gap-2 rounded-full bg-zinc-950 px-3 py-2 text-[13px] font-semibold text-white shadow-lg lg:hidden"
            onClick={() => setOpen(!open)}
            style={{ top: `calc(96px + (100vh - 240px) * ${state.progress})` }}
            type="button"
          >
            <TabIcon tab={current} className="[&>svg]:size-4" />
            {current.label}
            <span className="font-medium text-zinc-400">
              {index + 1}/{tabs.length}
            </span>
          </button>
          {open
            ? listMenu(
                "right-4 top-1/3 w-60 rounded-2xl border bg-popover p-1.5 shadow-xl",
              )
            : null}
        </>
      );
      break;
    case "mini-sheet":
      body = (
        <section className="fixed inset-x-0 bottom-[var(--bottom-nav-offset,0px)] z-[56] flex flex-col gap-2.5 rounded-t-[20px] border-t bg-background px-4 pt-2 pb-3.5 shadow-[0_-10px_30px_rgb(0_0_0/0.12)] lg:hidden">
          <span className="mx-auto block h-[5px] w-10 rounded-full bg-zinc-300" />
          <span className="flex flex-col">
            <span className="text-xs text-muted-foreground">Showing</span>
            <span className="text-[15px] font-semibold">{current.label}</span>
          </span>
          <div className="grid gap-2" style={grid}>
            {tabs.map((tab, i) => (
              <button
                className={cn(
                  "flex h-14 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl px-0.5 text-[11px] font-semibold",
                  tab.active
                    ? "bg-zinc-950 text-white"
                    : PASTELS[i % PASTELS.length],
                )}
                key={tab.value}
                onClick={() => choose(tab.value)}
                type="button"
              >
                <TabIcon tab={tab} className="[&>svg]:size-[18px]" />
                <span className="w-full truncate text-center">{tab.label}</span>
              </button>
            ))}
          </div>
        </section>
      );
      break;
    case "more-below":
      body = (
        <div
          className={cn(
            "pointer-events-none fixed inset-x-0 z-[56] flex justify-center px-4 lg:hidden",
            BOTTOM,
          )}
        >
          <button
            className="pointer-events-auto flex w-full max-w-xl cursor-pointer items-center justify-center gap-1.5 rounded-full bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white shadow-lg"
            onClick={() => choose(current.value)}
            type="button"
          >
            {tabs.length} tabs below
            <ChevronDown className="size-4 animate-bounce" />
          </button>
        </div>
      );
      break;
  }
  return (
    <>
      {hold}
      {/* Hidden while a drawer or dialog is open (globals.css), so it never
          sits over the More menu and the like. */}
      <div className="contents" data-tab-jump="">
        {body}
      </div>
    </>
  );
}

/**
 * The Tab shortcuts block: the tabs as links on the page itself (cards, a
 * contents list, round icons…), wherever it's placed. In the designer, with
 * no tab bar yet, it shows sample tabs.
 */
export function TabShortcuts({
  look = "on-this-walk",
  heading = "On this walk",
}: {
  look?: string;
  heading?: string;
}) {
  const anchor = useRef<HTMLDivElement>(null);
  const { state, choose } = useTabBar(anchor, "sticky");
  const sample: Tab[] = [
    "Details",
    "Map & weather",
    "Before you set off",
    "Attended",
    "Journey",
  ].map((label, i) => ({
    value: `sample-${i}`,
    label,
    icon: null,
    active: i === 0,
  }));
  const tabs = state?.tabs.length ? state.tabs : sample;
  const pick = (tab: Tab) => choose(tab.value);
  const index = Math.max(
    0,
    tabs.findIndex((tab) => tab.active),
  );
  const question = (label: string) =>
    QUESTIONS.find(([words]) => words.test(label))?.[1] ?? label;

  let body: ReactNode;
  switch (look) {
    case "cards":
      body = (
        <div className="grid grid-cols-2 gap-2.5">
          {tabs.map((tab, i) => (
            <button
              className={cn(
                "flex h-[104px] cursor-pointer flex-col items-start justify-between rounded-[14px] border p-3.5 text-left",
                tabs.length % 2 === 1 &&
                  i === tabs.length - 1 &&
                  "col-span-2 h-auto flex-row items-center justify-start gap-3",
              )}
              key={tab.value}
              onClick={() => pick(tab)}
              type="button"
            >
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-[10px]",
                  PASTELS[i % PASTELS.length],
                )}
              >
                <TabIcon tab={tab} className="[&>svg]:size-[18px]" />
              </span>
              <span className="text-sm font-semibold">{tab.label}</span>
            </button>
          ))}
        </div>
      );
      break;
    case "swipe-cards":
      body = (
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {tabs.map((tab, i) => (
            <button
              className={cn(
                "flex h-[150px] w-[220px] shrink-0 cursor-pointer snap-start flex-col justify-between rounded-2xl p-4 text-left",
                PASTELS[(i % (PASTELS.length - 1)) + 1],
              )}
              key={tab.value}
              onClick={() => pick(tab)}
              type="button"
            >
              <span className="flex items-center gap-2 text-[15px] font-semibold">
                <TabIcon tab={tab} />
                {tab.label}
              </span>
              <span className="flex items-center gap-1 text-[13px] font-semibold">
                Open
                <ChevronRight className="size-4" />
              </span>
            </button>
          ))}
        </div>
      );
      break;
    case "contents":
      body = (
        <div className="flex flex-col border-l-[3px] border-emerald-700 py-1 pl-3.5">
          {tabs.map((tab, i) => (
            <button
              className="flex h-11 cursor-pointer items-center gap-3 border-b border-muted text-left text-[15px] last:border-b-0"
              key={tab.value}
              onClick={() => pick(tab)}
              type="button"
            >
              <span className="w-6 text-[13px] text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">{tab.label}</span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      );
      break;
    case "steps":
      body = (
        <div className="flex items-start">
          {tabs.map((tab, i) => (
            <span className="flex flex-1 items-start" key={tab.value}>
              {i > 0 ? (
                <span
                  className={cn(
                    "mt-5 h-0.5 flex-1",
                    i <= index ? "bg-emerald-700" : "bg-border",
                  )}
                />
              ) : null}
              <button
                className="flex w-16 shrink-0 cursor-pointer flex-col items-center gap-1.5 text-center text-[11px] font-medium"
                onClick={() => pick(tab)}
                type="button"
              >
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full text-[15px] font-bold",
                    i < index
                      ? "bg-emerald-700 text-white"
                      : i === index
                        ? "border-2 border-emerald-700 text-emerald-700"
                        : "bg-muted",
                  )}
                >
                  {i < index ? <Check className="size-[18px]" /> : i + 1}
                </span>
                <span className="w-full truncate">{tab.label}</span>
              </button>
            </span>
          ))}
        </div>
      );
      break;
    case "icon-row":
    case "stories":
      body = (
        <div
          className={cn(
            look === "icon-row"
              ? "grid gap-1 rounded-2xl border px-1.5 py-3.5"
              : "flex gap-3.5 overflow-x-auto [scrollbar-width:none]",
          )}
          // The row of icons shares the width; story circles scroll.
          style={
            look === "icon-row"
              ? { gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }
              : undefined
          }
        >
          {tabs.map((tab, i) => (
            <button
              className={cn(
                "flex cursor-pointer flex-col items-center gap-1.5 text-[11px]",
                look === "stories" ? "w-16 shrink-0" : "min-w-0",
              )}
              key={tab.value}
              onClick={() => pick(tab)}
              type="button"
            >
              <span
                className={cn(
                  look === "stories" && "rounded-full border-2 p-[3px]",
                  look === "stories" &&
                    (tab.active ? "border-emerald-700" : "border-zinc-300"),
                )}
              >
                <span
                  className={cn(
                    "flex items-center justify-center rounded-full",
                    look === "stories" ? "size-[52px]" : "size-12",
                    PASTELS[i % PASTELS.length],
                  )}
                >
                  <TabIcon tab={tab} />
                </span>
              </span>
              <span
                className={cn(
                  "w-full truncate text-center",
                  tab.active && "font-semibold",
                )}
              >
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      );
      break;
    case "quick":
      body = (
        <div className="grid grid-cols-2 gap-2.5">
          {tabs.map((tab, i) => (
            <button
              className={cn(
                "flex h-[88px] cursor-pointer flex-col items-start justify-between rounded-2xl p-3.5 text-left text-[15px] font-bold",
                i === 0
                  ? "bg-emerald-700 text-white"
                  : PASTELS[i % PASTELS.length],
                tabs.length % 2 === 1 &&
                  i === tabs.length - 1 &&
                  "col-span-2 h-14 flex-row items-center justify-start gap-2.5",
              )}
              key={tab.value}
              onClick={() => pick(tab)}
              type="button"
            >
              <TabIcon tab={tab} className="[&>svg]:size-[22px]" />
              {tab.label}
            </button>
          ))}
        </div>
      );
      break;
    case "questions":
      body = (
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              className={cn(
                "cursor-pointer rounded-full border px-3.5 py-2.5 text-sm",
                tab.active
                  ? "border-emerald-700 bg-emerald-50 font-semibold text-emerald-950 dark:bg-emerald-950 dark:text-emerald-50"
                  : "",
              )}
              key={tab.value}
              onClick={() => pick(tab)}
              type="button"
            >
              {question(tab.label)}
            </button>
          ))}
        </div>
      );
      break;
    default:
      body = (
        <div className="grid grid-cols-2 gap-2">
          {tabs.map((tab) => (
            <button
              className="flex h-11 cursor-pointer items-center gap-2 rounded-[10px] border bg-background px-3 text-left text-sm font-medium"
              key={tab.value}
              onClick={() => pick(tab)}
              type="button"
            >
              <TabIcon tab={tab} className="[&>svg]:size-[18px]" />
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </div>
      );
  }
  return (
    <section
      aria-label={heading || "Tabs on this walk"}
      className="flex flex-col gap-2.5"
      ref={anchor}
    >
      {heading ? (
        <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {heading}
        </h2>
      ) : null}
      {body}
    </section>
  );
}
