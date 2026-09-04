import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[box-shadow] duration-200 ease-out outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50 md:text-sm touch-manipulation",
        (type === "file" ||
          type === "date" ||
          type === "time" ||
          type === "datetime-local" ||
          type === "month") &&
          "cursor-pointer file:cursor-pointer",
        // Same border colour at rest and on focus (border-input, never
        // border-ring) — only the ring around it grows in, exactly like
        // Clerk's own fields, instead of the border itself changing colour.
        "focus-visible:ring-[3px] focus-visible:ring-border",
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
