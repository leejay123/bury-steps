"use client";

import { HeaderCrumb } from "@/components/shadcnio/page-crumb";
import { walkHeaderTrail } from "@/lib/walk-header-trail";
import { walkStatus } from "@/lib/walk-window";
import { useWalkClock } from "@/hooks/use-walk-clock";

/** Walks › this walk, or Walks › History › this walk once it has finished or been cancelled. */
export function WalkHeaderCrumb({
  audience,
  cancelledAt,
  durationMins,
  endedAt,
  startsAt,
  title,
}: {
  audience: "organiser" | "member";
  cancelledAt: string | null;
  durationMins: number;
  endedAt: string | null;
  startsAt: string;
  title: string;
}) {
  const now = useWalkClock({ cancelledAt, durationMins, endedAt, startsAt });
  const status = walkStatus(
    {
      cancelledAt: cancelledAt ? new Date(cancelledAt) : null,
      durationMins,
      endedAt: endedAt ? new Date(endedAt) : null,
      startsAt: new Date(startsAt),
    },
    now,
  );
  return <HeaderCrumb title={title} trail={walkHeaderTrail(audience, status)} />;
}
