"use client";

import { Children, useState, type ReactNode } from "react";
import { BUTTON_SMALL_OUTLINE } from "./parts";

/** shadcn.io's striped filler cell (as beside their FAQ topics), so a row is never left with a hole. */
export const FILLER = "border-border bg-[repeating-linear-gradient(-45deg,var(--border)_0_1px,transparent_1px_6px)]";
const FIRST = 4;

/**
 * A grid that shows one full row (four) and a compact Read more that opens the
 * rest in place. Rows are always full: a short last row is finished with
 * striped filler cells (four across on computers, two on tablets).
 */
export function MoreRows({ label, className, children }: { label: string; className: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const items = Children.toArray(children);
  const more = items.length > FIRST;
  const shown = open || !more ? items : items.slice(0, FIRST);
  const fillLarge = (4 - (shown.length % 4)) % 4;
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
        <div className="flex justify-center border-t px-5 py-3">
          <button aria-expanded={open} className={BUTTON_SMALL_OUTLINE} onClick={() => setOpen(!open)} type="button">
            {open ? "Show less" : "Read more"}
          </button>
        </div>
      ) : null}
    </>
  );
}
