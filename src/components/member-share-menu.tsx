"use client";

import { CalendarPlus } from "lucide-react";
import type { WalkTiming } from "@/components/walk-header-styles";
import { ShareLinkButton } from "@/components/share-link";
import { Button } from "@/components/ui/button";
import { WalkManageMenu } from "@/components/walk-manage-menu";
import { useWalkClock } from "@/hooks/use-walk-clock";
import { canAddWalkToCalendar } from "@/lib/walk-window";

/**
 * Members' list on the walk page designs: Copy share link, and Add to
 * calendar until the walk is finished or cancelled (the .ics link 404s
 * then). Without the calendar it's just sharing, so it says Share walk
 * instead of Share or save. Changes on its own if the walk finishes while
 * the page is open.
 */
export function MemberShareMenu({
  calendarHref,
  shareUrl,
  timing,
}: {
  calendarHref: string;
  shareUrl: string;
  timing: WalkTiming;
}) {
  const now = useWalkClock(timing);
  const walk = {
    cancelledAt: timing.cancelledAt ? new Date(timing.cancelledAt) : null,
    durationMins: timing.durationMins,
    endedAt: timing.endedAt ? new Date(timing.endedAt) : null,
    startsAt: new Date(timing.startsAt),
  };
  const calendar = canAddWalkToCalendar(walk, now);
  return (
    <WalkManageMenu label={calendar ? "Share or save" : "Share walk"}>
      <ShareLinkButton url={shareUrl} />
      {calendar ? (
        <Button asChild size="sm" variant="outline">
          <a download href={calendarHref}>
            <CalendarPlus data-icon="inline-start" />
            Add to calendar
          </a>
        </Button>
      ) : null}
    </WalkManageMenu>
  );
}
