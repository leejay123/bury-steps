"use client";

import { Fragment, useContext, useEffect, useState } from "react";
import { WalkClockPreview } from "@/hooks/use-walk-clock";
import { useHydrated } from "@/hooks/use-hydrated";
import { serverNow } from "@/lib/server-clock";
import { formatCountdown, type CountdownStyle } from "@/lib/countdown-format";

/**
 * A countdown to `target` that ticks every second, in the chosen style. In the
 * walk page designer it counts from the preview's pretend time (Preview: …),
 * so each moment of a walk can be checked. Time-free until hydrated, so the
 * server's HTML matches.
 */
export function LiveCountdown({ target, style = "narrow" }: { target: Date; style?: CountdownStyle }) {
  const preview = useContext(WalkClockPreview);
  const hydrated = useHydrated();
  const [now, setNow] = useState(() => Date.now());
  const [start] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  if (!hydrated) return <span aria-hidden className="inline-block min-w-[4ch]" />;
  // The designer's pretend time moves on from when the preview was set.
  const at = preview ? preview.getTime() + (now - start) : serverNow().getTime();
  const text = formatCountdown(target.getTime() - at, style);
  if (style !== "digital") return <span className="tabular-nums">{text}</span>;
  // Digital: the colons softer than the numbers.
  return (
    <span className="tabular-nums">
      {text.split(":").map((part, i) => (
        <Fragment key={i}>
          {i > 0 ? <span className="text-muted-foreground/60">:</span> : null}
          {part}
        </Fragment>
      ))}
    </span>
  );
}
