"use client";

import { useEffect, type ReactNode } from "react";
import { usePuck, type Data, type UiState, type Viewports } from "@puckeditor/core";
import { Monitor, PanelLeft, PanelRight, Smartphone, Tablet, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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

/**
 * The designers' one top bar (Puck's `overrides.header`, so it sits inside Puck and can
 * change the preview size): Close, what's being designed and how it stands, the preview
 * size, then the actions with Publish last. `strip` is a second row for a designer's
 * own tools (the walk designer's Start from, Copy to, Preview, Clocked in).
 */
export function DesignerTopBar({
  busy = false,
  children,
  closeLabel,
  note,
  noteAlways = false,
  onClose,
  onPublish,
  secondary,
  status,
  strip,
  title,
}: {
  busy?: boolean;
  /** Beside the title (the walk designer's audience switch). */
  children?: ReactNode;
  closeLabel: string;
  /** One line under the title, on wide screens. */
  note?: ReactNode;
  /** Show the note at every width (a question that needs answering). */
  noteAlways?: boolean;
  onClose: () => void;
  onPublish: (data: Data) => void | Promise<void>;
  /** Before Publish (Discard draft). */
  secondary?: ReactNode;
  status?: DesignerStatus;
  strip?: ReactNode;
  title: string;
}) {
  const { appState, dispatch } = usePuck();
  const viewports = appState.ui.viewports;
  const ui = appState.ui;

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
    { label: "Blocks panel", icon: PanelLeft, on: ui.leftSideBarVisible, key: "leftSideBarVisible" as const },
    { label: "Settings panel", icon: PanelRight, on: ui.rightSideBarVisible, key: "rightSideBarVisible" as const },
  ];
  const setWidth = (width: number | "100%") =>
    dispatch({ type: "setUi", ui: { viewports: { ...viewports, current: { width, height: "auto" } } } });

  return (
    <div
      className="shrink-0 border-b bg-background"
      // The page preview's width (Puck's middle column): the size buttons fill its
      // right half, so their edge meets the line between Copy to and Preview.
      style={
        {
          "--designer-frame": `calc(100% - var(--puck-pluginbar-width, 0px) - ${
            ui.leftSideBarVisible ? "var(--puck-sidebar-left-width, 0px)" : "0px"
          } - ${ui.rightSideBarVisible ? "var(--puck-sidebar-right-width, 0px)" : "0px"})`,
        } as React.CSSProperties
      }
    >
      <div className="flex min-h-14 items-stretch">
        <button
          aria-label={closeLabel}
          className="flex w-(--puck-pluginbar-width,3.5rem) shrink-0 items-center justify-center border-r hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset disabled:opacity-50"
          disabled={busy}
          onClick={onClose}
          type="button"
        >
          <X aria-hidden className="size-4" />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-x-4 px-4 py-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate font-semibold">{title}</span>
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
            </span>
            {note ? (
              <span className={cn("truncate text-xs text-muted-foreground", !noteAlways && "hidden xl:block")}>
                {note}
              </span>
            ) : null}
          </div>
          {children}
        </div>
        {/* Show or hide the left (blocks, outline) and right (settings) panels. */}
        <div aria-label="Panels" className="flex" role="group">
          {panels.map((panel) => {
            const Icon = panel.icon;
            return (
              <button
                aria-label={`${panel.on ? "Hide" : "Show"} the ${panel.label.toLowerCase()}`}
                aria-pressed={panel.on}
                className={cn(
                  SEGMENT,
                  "px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  panel.on ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
                key={panel.key}
                onClick={() => dispatch({ type: "setUi", ui: { [panel.key]: !panel.on } })}
                title={`${panel.on ? "Hide" : "Show"} the ${panel.label.toLowerCase()}`}
                type="button"
              >
                <Icon aria-hidden className="size-4" />
              </button>
            );
          })}
        </div>
        <div
          aria-label="Preview size"
          className="@container flex shrink-0 basis-[calc(var(--designer-frame)/2)]"
          role="group"
        >
          {SIZES.map((size) => {
            const on = viewports.current.width === size.width;
            const Icon = size.icon;
            return (
              <button
                aria-label={size.label}
                aria-pressed={on}
                title={size.label}
                className={cn(
                  SEGMENT,
                  "min-w-0 flex-1 justify-center gap-2 px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  on ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
                key={size.label}
                onClick={() => setWidth(size.width)}
                type="button"
              >
                <Icon aria-hidden className="size-4" />
                {/* Words too when the half has room for them; just the icons when it doesn't. */}
                <span className="hidden @[20rem]:inline">{size.label}</span>
              </button>
            );
          })}
        </div>
        {/* Exactly over the settings panel while it shows, so the line beside
            Publish runs straight down its edge. */}
        <div
          className={cn(
            SEGMENT,
            "gap-2 px-3 py-2 lg:px-4",
            ui.rightSideBarVisible && "w-(--puck-sidebar-right-width) justify-end",
          )}
        >
          {secondary}
          <Button disabled={busy} onClick={() => void onPublish(appState.data)} size="sm" type="button">
            Publish
          </Button>
        </div>
      </div>
      {/* The strip's first tool spans the Blocks rail and left panel, its last sits over
          the settings panel, so its lines carry on down the panels' edges (globals.css). */}
      {strip ? (
        <div
          className="flex items-stretch border-t bg-muted/30"
          data-designer-strip=""
          data-left={ui.leftSideBarVisible ? "on" : "off"}
          data-right={ui.rightSideBarVisible ? "on" : "off"}
        >
          {strip}
        </div>
      ) : null}
    </div>
  );
}

/** One labelled tool in the strip: a full-height segment, sharing the row equally. */
export function DesignerStripItem({ children, first, label }: { children: ReactNode; first?: boolean; label: string }) {
  return (
    <div className={cn("flex min-h-12 min-w-0 flex-1 items-center gap-3 px-4", !first && "border-l")}>
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
