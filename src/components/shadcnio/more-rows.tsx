"use client";

import { Children, useState, type ReactNode } from "react";
import { BUTTON_SMALL_OUTLINE } from "./parts";

/** The strip a Read more / Show more sits in: white (the default) or light grey (chosen per section in the page designer). */
export type StripTone = "white" | "grey";
export const STRIP_BG: Record<StripTone, string> = { white: "bg-background", grey: "bg-muted/30" };
export const stripTone = (value: unknown): StripTone => (value === "grey" ? "grey" : "white");

/** shadcn.io's striped filler cell (as beside their FAQ topics), so a row is never left with a hole. */
export const FILLER = "border-border bg-[repeating-linear-gradient(-45deg,var(--border)_0_1px,transparent_1px_6px)]";

/**
 * A grid that shows the first full row, then a compact Read more that opens the
 * rest in place. Rows are always full: a short last row is finished with
 * striped filler cells (large screens use `columns`; tablets stay two across).
 */
export function MoreRows({
  label,
  className,
  children,
  first = 4,
  columns = 4,
  tone = "white",
}: {
  label: string;
  className: string;
  children: ReactNode;
  /** How many tiles show before Read more. Default one full row of four. */
  first?: number;
  /** Column count on large screens, for filler cells. Default four. */
  columns?: number;
  /** The Read more strip's background. */
  tone?: StripTone;
}) {
  const [open, setOpen] = useState(false);
  const items = Children.toArray(children);
  const more = items.length > first;
  const shown = open || !more ? items : items.slice(0, first);
  const fillLarge = (columns - (shown.length % columns)) % columns;
  const fillTablet = shown.length % 2;
  return (
    <>
      <ul aria-label={label} className={className}>
        {shown}
        {Array.from({ length: fillLarge }, (_, i) => (
          <li
            aria-hidden="true"
            className={`${FILLER} ${i < fillTablet ? "max-sm:hidden" : "hidden lg:block"}`}
            key={`fill-${i}`}
          />
        ))}
      </ul>
      {more ? (
        <div className={`flex justify-center border-t px-5 py-3 ${STRIP_BG[tone]}`}>
          <button aria-expanded={open} className={BUTTON_SMALL_OUTLINE} onClick={() => setOpen(!open)} type="button">
            {open ? "Show less" : "Read more"}
          </button>
        </div>
      ) : null}
    </>
  );
}
