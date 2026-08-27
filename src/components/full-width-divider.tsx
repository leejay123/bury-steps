import type * as React from "react";
import { cn } from "@/lib/utils";

type FullWidthDividerProps = React.ComponentProps<"div"> & {
  /** Sit on the parent’s edges (the 1200px column). Viewport-wide if false. */
  contained?: boolean;
  position?: "top" | "bottom";
};

export function FullWidthDivider({
  className,
  contained = true,
  position,
  ...props
}: FullWidthDividerProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute z-20 h-px bg-border",
        contained ? "inset-x-0 w-full" : "left-1/2 w-screen -translate-x-1/2",
        position === "top" && "-top-px",
        position === "bottom" && "-bottom-px",
        className,
      )}
      {...props}
    />
  );
}
