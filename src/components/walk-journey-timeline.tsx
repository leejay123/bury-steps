"use client";

import { formatTime } from "@/lib/dates";
import type { JourneyEventView } from "@/lib/walk-journey";
import { cn } from "@/lib/utils";

/**
 * Simple vertical timeline — no scroll-linked motion. Safari struggles with
 * Framer useScroll/useSpring on long pages; this stays light on every browser.
 */
export function WalkJourneyTimeline({
  className,
  events,
}: {
  className?: string;
  events: JourneyEventView[];
}) {
  if (events.length === 0) return null;

  return (
    <ol className={cn("relative flex flex-col gap-0 border-l border-border pl-6", className)}>
      {events.map((event, index) => (
        <li className="relative pb-8 last:pb-0" key={event.id}>
          <span
            aria-hidden
            className={cn(
              "absolute top-1.5 -left-[1.625rem] size-2.5 rounded-full border-2 border-background bg-foreground",
              index === 0 && "bg-foreground",
            )}
          />
          <p className="text-sm tabular-nums text-muted-foreground">{formatTime(event.happenedAt)}</p>
          <h3 className="mt-1 text-base font-medium tracking-tight text-foreground">{event.title}</h3>
          {event.body ? (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{event.body}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
