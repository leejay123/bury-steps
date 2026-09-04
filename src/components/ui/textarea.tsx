import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground aria-invalid:border-destructive flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[box-shadow] duration-200 ease-out outline-none focus-visible:ring-[3px] focus-visible:ring-border disabled:cursor-not-allowed disabled:opacity-50 md:text-sm touch-manipulation",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
