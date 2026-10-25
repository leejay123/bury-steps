"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { DescriptionText, InlineDescriptionText } from "@/components/description-text";

const COLLAPSED_LINE_CLAMP = "line-clamp-6";
/** Rough character count past which a description is worth collapsing —
 * below this, line-clamp-6 wouldn't kick in on most screens anyway. */
const LONG_DESCRIPTION_THRESHOLD = 400;

/** Long walk descriptions (start point, duration, leader, full route notes,
 * What3Words, …) used to render as one uncapped paragraph — on a walk with a
 * lot of copy that pushed everything else on the page down below the fold.
 * Collapses to a few lines with a Read more toggle; expanded shows it all.
 * (It used to scroll inside a fixed-height box, but phones hide that
 * scrollbar, so the last visible line just looked cut in half.) Collapsed
 * preview still renders **bold** (via InlineDescriptionText, no paragraph splitting — line-clamp
 * needs one continuous inline flow to count lines correctly); expanded view
 * gets real paragraph breaks too, via DescriptionText — at the same text size
 * as the preview (no `typeset` class, which bumps text up to 1.125em). */
export function WalkDescription({
  description,
  footerClassName,
}: {
  description: string;
  /** Read more as its box's bottom row (a line above it, the box's full width). */
  footerClassName?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  // A first guess from the length (so the page doesn't jump on load), then
  // measured: Read more only shows when the six lines really cut text off.
  // By length alone, a 600-character description on a wide screen fits in
  // fewer lines, and Read more did nothing.
  const [isLong, setIsLong] = useState(description.length > LONG_DESCRIPTION_THRESHOLD);
  const preview = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = preview.current;
    if (!el || expanded) return;
    const measure = () => {
      // Hidden (e.g. in a closed tab) measures as zero; keep the guess.
      if (el.clientHeight === 0) return;
      setIsLong(el.scrollHeight > el.clientHeight + 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [description, expanded]);

  // Plain text + chevron, no button chrome — only the chevron animates
  // on toggle, no hover background/color change.
  const toggle = (
    <button
      aria-expanded={expanded}
      className="flex w-fit cursor-pointer items-center gap-1 text-sm font-medium text-muted-foreground"
      onClick={() => setExpanded((prev) => !prev)}
      type="button"
    >
      {expanded ? "Show less" : "Read more"}
      <ChevronDown className={cn("size-4 transition-transform duration-200", expanded && "rotate-180")} />
    </button>
  );
  return (
    <div className="flex flex-col gap-2 text-sm leading-relaxed">
      {expanded ? (
        <DescriptionText text={description} />
      ) : (
        <p className={COLLAPSED_LINE_CLAMP} ref={preview}>
          <InlineDescriptionText text={description} />
        </p>
      )}
      {isLong ? (
        footerClassName ? (
          <div className={footerClassName}>{toggle}</div>
        ) : (
          toggle
        )
      ) : null}
    </div>
  );
}
