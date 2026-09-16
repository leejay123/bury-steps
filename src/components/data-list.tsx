"use client";

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
      className={cn("flex flex-col overflow-hidden rounded-xl border bg-card", className)}
      {...props}
    />
  );
}

export function DataListItem({
  className,
  onClick,
  onKeyDown,
  role,
  tabIndex,
  ...props
}: React.ComponentProps<"li">) {
  // Rows that open something on click (a drawer, a detail view) instead of
  // wrapping their content in a real link need the same keyboard support a
  // link would give for free: focusable, and Enter/Space activates it.
  const clickable = typeof onClick === "function";

  return (
    <li
      className={cn(
        "flex cursor-pointer items-center gap-3 border-b p-3 last:border-0 hover:bg-muted/50",
        clickable &&
          "focus-visible:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      onClick={onClick}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        // Ignore keydowns that bubbled up from a nested interactive element
        // (e.g. the "Remove" button in DataListActions) — only the row
        // itself being focused should trigger the row's own action.
        if (!clickable || event.defaultPrevented || event.target !== event.currentTarget) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.(event as unknown as React.MouseEvent<HTMLLIElement>);
        }
      }}
      role={clickable ? (role ?? "button") : role}
      tabIndex={clickable ? (tabIndex ?? 0) : tabIndex}
      {...props}
    />
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
  return <div className={cn("min-w-0 flex-1", className)} {...props} />;
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
