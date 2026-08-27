"use client";

import { cn } from "@/lib/utils";

export function DataList({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      className={cn("flex flex-col overflow-hidden rounded-xl border bg-card", className)}
      {...props}
    />
  );
}

export function DataListItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      className={cn(
        "flex items-center gap-3 border-b p-3 last:border-0",
        props.onClick && "cursor-pointer hover:bg-muted/50",
        className,
      )}
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
