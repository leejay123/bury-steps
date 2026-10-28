import * as React from "react";
import { cn } from "@/lib/utils";

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "pointer-events-none inline-flex h-5 min-w-5 select-none items-center justify-center gap-1 rounded-sm bg-muted px-1 font-sans text-xs font-medium text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

/** Keys shown together, e.g. ⌘ B (used by the Efferd dashboard test). */
function KbdGroup({ className, ...props }: React.ComponentProps<"kbd">) {
  return <kbd className={cn("inline-flex items-center gap-1", className)} data-slot="kbd-group" {...props} />;
}

export { Kbd, KbdGroup };
