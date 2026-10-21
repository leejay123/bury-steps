"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { Paintbrush } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WalkIdeaParts } from "@/components/walk-idea-layouts";
import type { WalkDesigns } from "@/lib/walk-page-choice";

// The editor (and Puck) only loads when someone opens it.
const WalkDesignEditor = dynamic(
  () => import("./editor").then((mod) => mod.WalkDesignEditor),
  { ssr: false },
);

/** Remembers, in this tab, that the designer was open on this page (survives a reload). */
const OPEN_KEY = "walk-designer-open";
const OPEN_EVENT = "walk-designer-open";

function readOpen(): boolean {
  try {
    return sessionStorage.getItem(OPEN_KEY) === window.location.pathname;
  } catch {
    return fallbackOpen;
  }
}

function writeOpen(open: boolean) {
  try {
    if (open) sessionStorage.setItem(OPEN_KEY, window.location.pathname);
    else sessionStorage.removeItem(OPEN_KEY);
  } catch {
    // No storage (private window): fall back to this page only.
    fallbackOpen = open;
  }
  window.dispatchEvent(new Event(OPEN_EVENT));
}
let fallbackOpen = false;

function subscribeOpen(onChange: () => void) {
  window.addEventListener(OPEN_EVENT, onChange);
  return () => window.removeEventListener(OPEN_EVENT, onChange);
}

/**
 * The walk and its saved designs, for "Design this page", and whether the
 * designer is open. It's kept here, at the top of the page, rather than in
 * the button: the button sits in the walk's Manage list, which a Publish
 * (the page refreshing to show the new design) rebuilds, and the designer
 * used to close every time.
 */
const WalkDesignContext = createContext<{ open: () => void } | null>(null);

export function WalkDesignProvider({
  children,
  designs,
  parts,
}: {
  children: ReactNode;
  designs: WalkDesigns;
  parts: WalkIdeaParts;
}) {
  // Open or not is kept in this tab's storage (for this page), so it lasts
  // through the page refreshing after a Publish, and even a full reload.
  const isOpen = useSyncExternalStore(subscribeOpen, readOpen, () => false);
  const open = useCallback(() => writeOpen(true), []);
  const close = useCallback(() => writeOpen(false), []);

  return (
    <WalkDesignContext.Provider value={{ open }}>
      {children}
      {isOpen
        ? createPortal(
            <WalkDesignEditor
              designs={designs}
              onClose={close}
              parts={parts}
            />,
            document.body,
          )
        : null}
    </WalkDesignContext.Provider>
  );
}

const WIDE = "(min-width: 1024px)";
function subscribeWide(change: () => void) {
  const query = window.matchMedia(WIDE);
  query.addEventListener("change", change);
  return () => query.removeEventListener("change", change);
}
const isWide = () => window.matchMedia(WIDE).matches;

/**
 * "Design this page", in the organiser walk page's Manage list: opens the
 * walk page designer over this walk. Computers only (1024px and wider): the
 * designer needs the room, so phones and tablets don't offer it.
 */
export function WalkDesignButton() {
  const value = useContext(WalkDesignContext);
  // Not drawn at all on smaller screens (the Manage list copies every button
  // it's given, hidden or not).
  const computer = useSyncExternalStore(subscribeWide, isWide, () => false);
  if (!value || !computer) return null;
  return (
    <Button onClick={value.open} size="sm" type="button" variant="outline">
      <Paintbrush data-icon="inline-start" />
      Design this page
    </Button>
  );
}
