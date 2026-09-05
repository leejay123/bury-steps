import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground aria-invalid:border-destructive flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[box-shadow,border-color] duration-200 ease-out outline-none hover:border-ring focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-border disabled:cursor-not-allowed disabled:opacity-50 md:text-sm touch-manipulation",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
