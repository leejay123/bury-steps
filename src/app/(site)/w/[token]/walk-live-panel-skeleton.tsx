"use client";

import { useWalkClock } from "@/hooks/use-walk-clock";
import { windowState } from "@/lib/walk-window";
import { ClockInDrawer } from "./clock-in-drawer";

/**
 * The clock-in panel while a member's part of the walk page loads (it's
 * always fetched fresh, never a saved copy): while clock-in is open, the
 * real Clock in button drawn blank and greyed ([data-sk-mask] in globals.css),
 * so it's exactly the shape of what replaces it. Before clock-in opens and
 * after it closes the panel is empty for members, so this is too. Only
 * browsers the site remembers as signed in show it (data-member-home).
 */
export function WalkLivePanelSkeleton({
  durationMins,
  endedAt,
  startsAt,
}: {
  durationMins: number;
  endedAt: string | null;
  startsAt: string;
}) {
  const now = useWalkClock({ cancelledAt: null, durationMins, endedAt, startsAt });
  const state = windowState(new Date(startsAt), durationMins, now, endedAt ? new Date(endedAt) : null);
  if (state !== "open") return null;
  return (
    <div aria-hidden className="contents" data-member-home="" data-page-loading="" data-sk-mask="" inert>
      <section className="flex flex-col gap-4 rounded-lg border p-5 sm:p-6">
        <h2 className="font-semibold">Clock in</h2>
        <div>
          <ClockInDrawer token="" />
        </div>
      </section>
    </div>
  );
}
