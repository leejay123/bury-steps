"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { DescriptionText } from "@/components/description-text";

const COLLAPSED_LINE_CLAMP = "line-clamp-6";
/** Rough character count past which a description is worth collapsing —
 * below this, line-clamp-6 wouldn't kick in on most screens anyway. */
const LONG_DESCRIPTION_THRESHOLD = 400;

/** Thin, unobtrusive scrollbar for the expanded description box — Firefox
 * via `scrollbar-width`, WebKit/Blink via the `::-webkit-scrollbar` pseudo. */
const THIN_SCROLLBAR_CLASSNAME =
  "[scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border";

/** Long walk descriptions (start point, duration, leader, full route notes,
 * What3Words, …) used to render as one uncapped paragraph — on a walk with a
 * lot of copy that pushed everything else on the page down below the fold.
 * Collapses to a few lines with a Read more toggle; expanded state scrolls
 * within itself instead of growing the page. Collapsed preview stays plain
 * text (line-clamp truncates raw text more predictably than paragraph
 * markup); expanded view renders **bold** and real paragraph breaks via
 * DescriptionText. */
export function WalkDescription({ description }: { description: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = description.length > LONG_DESCRIPTION_THRESHOLD;

  return (
    <div className="flex flex-col gap-2 text-sm leading-relaxed">
      {expanded ? (
        <DescriptionText
          className={cn("max-h-72 overflow-y-auto pr-2", THIN_SCROLLBAR_CLASSNAME)}
          text={description}
        />
      ) : (
        <p className={cn("whitespace-pre-line", isLong && COLLAPSED_LINE_CLAMP)}>{description}</p>
      )}
      {isLong ? (
        // Plain text + chevron, no button chrome — only the chevron animates
        // on toggle, no hover background/color change.
        <button
          aria-expanded={expanded}
          className="flex w-fit cursor-pointer items-center gap-1 text-sm font-medium text-muted-foreground"
          onClick={() => setExpanded((prev) => !prev)}
          type="button"
        >
          {expanded ? "Show less" : "Read more"}
          <ChevronDown className={cn("size-4 transition-transform duration-200", expanded && "rotate-180")} />
        </button>
      ) : null}
    </div>
  );
}
