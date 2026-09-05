import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[box-shadow,border-color] duration-200 ease-out outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50 md:text-sm touch-manipulation",
        (type === "file" ||
          type === "date" ||
          type === "time" ||
          type === "datetime-local" ||
          type === "month") &&
          "cursor-pointer file:cursor-pointer",
        // Matches Clerk's own recipe: the border itself darkens (to --ring)
        // on both hover and focus, and focus additionally grows a wide,
        // pale ring in the lighter --border shade around it. Using a
        // different, lighter colour for the ring than the border is what
        // keeps the two visually distinct instead of blurring into one
        // thick smear.
        "hover:border-ring focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-border",
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
