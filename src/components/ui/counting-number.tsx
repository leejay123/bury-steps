"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A number that counts up to `value`, easing as it lands — after shadcn.io's Counting Number
 * (same props and behaviour: a 30 ms timer, Intl.NumberFormat, trigger "mount" or "view").
 * It keeps the room of its final value from the first paint, so the line around it never
 * shifts; screen readers and no-JS get the final number. Reduced motion: no count.
 */
export function CountingNumber({
  value,
  from = 0,
  duration = 2000,
  decimals = 0,
  grouping = false,
  locale = "en-GB",
  pad = 1,
  trigger = "mount",
  onComplete,
  className,
}: {
  value: number;
  from?: number;
  duration?: number;
  decimals?: number;
  grouping?: boolean;
  locale?: string;
  pad?: number;
  trigger?: "mount" | "view";
  onComplete?: () => void;
  className?: string;
}) {
  const format = (n: number) =>
    new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      minimumIntegerDigits: pad,
      useGrouping: grouping,
    }).format(n);
  const [shown, setShown] = useState(from);
  const ref = useRef<HTMLSpanElement>(null);
  const current = useRef(from);
  const done = useRef(onComplete);
  useEffect(() => {
    done.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const start = current.current;
    if (start === value) return;
    // Reduced motion: straight to the number (on the first tick).
    const length = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : duration;
    let timer = 0;
    let began = 0;
    const tick = () => {
      const t = length > 0 ? Math.min(1, (performance.now() - began) / length) : 1;
      const eased = 1 - (1 - t) ** 3;
      const next = t >= 1 ? value : start + (value - start) * eased;
      current.current = next;
      setShown(next);
      if (t >= 1) {
        window.clearInterval(timer);
        done.current?.();
      }
    };
    const run = () => {
      began = performance.now();
      timer = window.setInterval(tick, 30);
    };
    if (trigger === "view" && ref.current && "IntersectionObserver" in window) {
      const seen = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          seen.disconnect();
          run();
        }
      });
      seen.observe(ref.current);
      return () => {
        seen.disconnect();
        window.clearInterval(timer);
      };
    }
    run();
    return () => window.clearInterval(timer);
  }, [value, duration, trigger]);

  return (
    <span className={cn("relative inline-grid tabular-nums", className)} data-slot="counting-number" ref={ref}>
      <span className="sr-only">{format(value)}</span>
      {/* The final number, unseen, holds the width; the count sits over it. */}
      <span aria-hidden="true" className="invisible col-start-1 row-start-1">
        {format(value)}
      </span>
      <span aria-hidden="true" className="col-start-1 row-start-1 text-end">
        {format(shown)}
      </span>
    </span>
  );
}
