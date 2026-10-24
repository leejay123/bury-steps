"use client";

import { CalendarPlus } from "lucide-react";
import type { WalkTiming } from "@/components/walk-header-styles";
import { Button } from "@/components/ui/button";
import { useWalkClock } from "@/hooks/use-walk-clock";
import { canAddWalkToCalendar } from "@/lib/walk-window";

/**
 * Add to calendar, for the walk page designs' Share or save list. Gone once
 * the walk is finished or cancelled (the .ics link 404s then), and goes on
 * its own if the walk finishes while the page is open.
 */
export function AddToCalendarButton({ href, timing }: { href: string; timing: WalkTiming }) {
  const now = useWalkClock(timing);
  const walk = {
    cancelledAt: timing.cancelledAt ? new Date(timing.cancelledAt) : null,
    durationMins: timing.durationMins,
    endedAt: timing.endedAt ? new Date(timing.endedAt) : null,
    startsAt: new Date(timing.startsAt),
  };
  if (!canAddWalkToCalendar(walk, now)) return null;
  return (
    <Button asChild size="sm" variant="outline">
      <a download href={href}>
        <CalendarPlus data-icon="inline-start" />
        Add to calendar
      </a>
    </Button>
  );
}
