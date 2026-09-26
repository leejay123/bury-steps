"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const COLLAPSED_LINE_CLAMP = "line-clamp-6";
/** Rough character count past which a description is worth collapsing —
 * below this, line-clamp-6 wouldn't kick in on most screens anyway. */
const LONG_DESCRIPTION_THRESHOLD = 400;

/** Long walk descriptions (start point, duration, leader, full route notes,
 * What3Words, …) used to render as one uncapped paragraph — on a walk with a
 * lot of copy that pushed everything else on the page down below the fold.
 * Collapses to a few lines with a Read more toggle; expanded state scrolls
 * within itself instead of growing the page. */
export function WalkDescription({ description }: { description: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = description.length > LONG_DESCRIPTION_THRESHOLD;

  return (
    <div className="flex flex-col gap-2">
      <p
        className={cn(
          "text-sm leading-relaxed whitespace-pre-line",
          !expanded && isLong && COLLAPSED_LINE_CLAMP,
          expanded && "max-h-72 overflow-y-auto pr-1",
        )}
      >
        {description}
      </p>
      {isLong ? (
        <Button
          aria-expanded={expanded}
          className="w-fit"
          onClick={() => setExpanded((prev) => !prev)}
          size="sm"
          type="button"
          variant="ghost"
        >
          {expanded ? "Show less" : "Read more"}
          <ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} />
        </Button>
      ) : null}
    </div>
  );
}
