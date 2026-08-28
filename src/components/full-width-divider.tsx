import type * as React from "react";
import { cn } from "@/lib/utils";

type FullWidthDividerProps = React.ComponentProps<"div"> & {
  position?: "top" | "bottom";
};

// Sits on the edges of its positioned ancestor (always the 1200px column in
// practice). Deliberately `w-full`/`inset-x-0` rather than `w-screen`: vw
// units include the scrollbar's own width on desktop, so a `w-screen`
// divider ends up a few px wider than the actual viewport — exactly the
// kind of sideways overflow `overflow-x: clip` on <html>/<body> is meant to
// rule out.
export function FullWidthDivider({ className, position, ...props }: FullWidthDividerProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-x-0 z-20 h-px w-full bg-border",
        position === "top" && "-top-px",
        position === "bottom" && "-bottom-px",
        className,
      )}
      {...props}
    />
  );
}
