"use client";

import { createElement, useId, useState, type ReactNode } from "react";
import { InlineScript } from "@/components/inline-script";
import { FIRST_VISIT_ROWS, LIST_PAGE_SIZE } from "@/lib/list-page-size";
import { rememberedRowsCookie } from "@/lib/remembered-rows-key";

/** The count the list saved last time (RememberListCount), or FIRST_VISIT_ROWS. */
function readCount(name: string, max: number): number {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=(\\d+)`));
    return match ? Math.min(Number(match[1]), max) : Math.min(FIRST_VISIT_ROWS, max);
  } catch {
    return Math.min(FIRST_VISIT_ROWS, max);
  }
}

/**
 * A list placeholder with as many rows as the list showed last time, from
 * the very first paint. The ready-made page can't know that number (it's
 * the same for everyone), so it carries the most rows a list shows and:
 *
 * - on a refresh, the script just after the list hides the extra rows
 *   while the page is read, before anything is drawn;
 * - on a page change, the count is read straight from the browser.
 *
 * Either way there is one placeholder, the right size, instead of a first
 * guess replaced by a second. Pattern from the Next.js guide "Preventing
 * flash before hydration" (see InlineScript).
 */
export function RememberedRows({
  remember,
  rows,
  as = "div",
  className,
  rowAs = "div",
  rowClassName,
  leading,
  empty,
  max = LIST_PAGE_SIZE,
  known,
}: {
  /** The list's key, as given to RememberListCount. */
  remember: string;
  /** One placeholder row per possible row (up to max). */
  rows: ReactNode[];
  as?: "div" | "ul";
  className?: string;
  rowAs?: "div" | "li";
  rowClassName?: string;
  /** Drawn before the rows and not counted (e.g. the Members group strip). */
  leading?: ReactNode;
  /** Shown instead when the list was empty last time: the empty box's shape (EmptyStateSkeleton). */
  empty?: ReactNode;
  max?: number;
  /** The real row count, when the list is the same for everyone (list-counts.ts):
   * drawn exactly, instead of last time's count. A filtered address (?role=…)
   * can only have fewer, so there it's capped by last time's count too. */
  known?: number;
}) {
  const id = useId();
  const name = rememberedRowsCookie(remember);
  const limit = Math.min(max, rows.length);
  // Server: unknown (null), so every row is in the page for the script to
  // trim. Browser: the remembered count, the same one the script uses.
  const exact = known === undefined ? null : Math.max(0, Math.min(known, limit));
  const [count] = useState<number | null>(() => {
    if (typeof window === "undefined") return exact;
    if (exact === null) return readCount(name, limit);
    return window.location.search ? Math.min(exact, readCount(name, limit)) : exact;
  });

  const first = Math.min(FIRST_VISIT_ROWS, limit);
  const script = `{var m=document.cookie.match(/(?:^|; )${name}=(\\d+)/);var c=m?Math.min(+m[1],${limit}):${first};var n=${
    exact === null ? "c" : `location.search?Math.min(${exact},c):${exact}`
  };var el=document.getElementById(${JSON.stringify(id)});var e=document.getElementById(${JSON.stringify(`${id}-empty`)});if(e&&n===0)e.removeAttribute("hidden");if(el){if(n===0)el.setAttribute("hidden","");var r=el.querySelectorAll(":scope>[data-sk-row]");for(var i=n;i<r.length;i++)r[i].setAttribute("hidden","")}}`;

  return (
    <>
      {createElement(
        as,
        {
          "aria-busy": "true",
          className,
          "data-reveal-list": "",
          hidden: count === 0 || undefined,
          id,
          suppressHydrationWarning: true,
        },
        leading,
        rows.slice(0, limit).map((row, i) =>
          createElement(
            rowAs,
            {
              className: rowClassName,
              "data-sk-row": "",
              hidden: (count !== null && i >= count) || undefined,
              key: i,
              suppressHydrationWarning: true,
            },
            row,
          ),
        ),
      )}
      {empty ? (
        <div hidden={count !== 0 || undefined} id={`${id}-empty`} suppressHydrationWarning>
          {empty}
        </div>
      ) : null}
      <InlineScript html={script} />
    </>
  );
}
