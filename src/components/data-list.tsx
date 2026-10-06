"use client";

import { createContext, useContext, useId } from "react";
import { cn } from "@/lib/utils";

/** Mobile: stack body above actions. Desktop: one horizontal row. */
export const dataListItemStackClassName =
  "flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3";

/** Mobile: actions on their own row under a hairline. Desktop: inline. */
export const dataListActionsStackClassName =
  "justify-end border-t pt-2 sm:border-0 sm:pt-0";

export function DataList({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      // Lists and tables get the Members-style reveal (content-reveal.tsx).
      data-reveal-list=""
      className={cn("flex flex-col overflow-hidden rounded-xl border bg-card", className)}
      {...props}
    />
  );
}

const RowLabelContext = createContext<string | undefined>(undefined);

export function DataListItem({
  "aria-label": ariaLabel,
  children,
  className,
  onClick,
  ...props
}: React.ComponentProps<"li">) {
  const labelId = useId();
  // Rows that open something on click (a drawer, a detail view) instead of
  // wrapping their content in a real link get a real button for keyboard
  // and screen-reader users, named by the row's text (DataListBody). The
  // row itself used to be the "button", with Remove / Mark read buttons
  // inside it — read out as one long button, and not valid in a list.
  if (typeof onClick !== "function") {
    return (
      // No pointer of its own: a row that opens something does so through a
      // link inside it, which brings its own.
      <li className={cn("flex items-center gap-3 border-b p-3 last:border-0 hover:bg-muted/50", className)} {...props}>
        {children}
      </li>
    );
  }
  return (
    <li
      className={cn(
        "relative flex cursor-pointer items-center gap-3 border-b p-3 last:border-0 hover:bg-muted/50",
        "has-[>[data-row-open]:focus-visible]:bg-muted/50 has-[>[data-row-open]:focus-visible]:ring-2 has-[>[data-row-open]:focus-visible]:ring-ring has-[>[data-row-open]:focus-visible]:ring-inset",
        className,
      )}
      onClick={onClick}
      {...props}
    >
      <button
        aria-label={ariaLabel}
        aria-labelledby={ariaLabel ? undefined : labelId}
        className="sr-only"
        data-row-open=""
        onClick={(event) => {
          // The row's own onClick would otherwise run a second time.
          event.stopPropagation();
          onClick(event as unknown as React.MouseEvent<HTMLLIElement>);
        }}
        type="button"
      />
      <RowLabelContext.Provider value={labelId}>{children}</RowLabelContext.Provider>
    </li>
  );
}

/** Content + chevron row when the item uses {@link dataListItemStackClassName}. */
export function DataListItemMain({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex min-w-0 flex-1 items-start gap-2 sm:items-center", className)}
      {...props}
    />
  );
}

export function DataListBody({ className, ...props }: React.ComponentProps<"div">) {
  // Names a clickable row's open button (see DataListItem).
  const labelId = useContext(RowLabelContext);
  return <div className={cn("min-w-0 flex-1", className)} id={labelId} {...props} />;
}

export function DataListActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex shrink-0 items-center gap-1", className)}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      {...props}
    />
  );
}

/** A section divider inside a DataList — a grey strip with an uppercase
 * label and count, sitting as its own `<li>` before the rows it groups
 * (see MembersTable's role sections, or WalkAttendanceTable's groups). No
 * `border-t`: every group but the last already ends on a row with its own
 * `border-b` (DataListItem), so adding one here too doubled up into two
 * hairlines stacked back to back between groups. */
export function DataListGroupHeader({ count, label }: { count: number; label: string }) {
  return (
    <li
      aria-hidden
      className="flex items-baseline gap-1.5 border-b bg-muted/50 px-3 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
    >
      {label}
      <span className="text-xs font-normal normal-case text-muted-foreground/80">({count})</span>
    </li>
  );
}
