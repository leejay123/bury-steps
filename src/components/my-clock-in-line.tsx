"use client";

import { formatWalkDate } from "@/lib/dates";

/**
 * One line about this person's own clock-in, for a designed page's Details
 * card ("Your clock-in" inside the title box): nothing until they clock in.
 */
export function MyClockInLine({
  clockedInAt,
  clockedOutAt,
  completed,
}: {
  clockedInAt: string | null;
  clockedOutAt: string | null;
  completed: boolean;
}) {
  if (!clockedInAt) return null;
  return (
    <p className="text-sm tabular-nums">
      {clockedOutAt ? (
        <>
          <span className="font-medium">
            You clocked in at {formatWalkDate(clockedInAt)}
          </span>
          <span className="text-muted-foreground">
            {" "}
            · left at {formatWalkDate(clockedOutAt)}
          </span>
        </>
      ) : (
        <>
          <span className="font-medium">
            {completed ? "You attended this walk" : "You are clocked in"}
          </span>
          <span className="text-muted-foreground">
            {" "}
            · Recorded at {formatWalkDate(clockedInAt)}
          </span>
        </>
      )}
    </p>
  );
}
