"use client";

import { useEffect, useId, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Self-built equivalent of cult-ui's Stripe Background Guides (the actual
 * registry is behind Vercel bot-protection right now, so this is a from-
 * scratch component matching the same idea rather than a pull of their
 * source) — evenly spaced vertical hairlines with one column's glow pulsing
 * at a time, on a fixed interval. */
export function StripeBgGuides({
  className,
  columnCount = 6,
  glowColor = "var(--primary)",
  intervalMs = 3000,
}: {
  className?: string;
  columnCount?: number;
  glowColor?: string;
  intervalMs?: number;
}) {
  const id = useId();
  const reduce = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % columnCount);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [columnCount, intervalMs, reduce]);

  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {Array.from({ length: columnCount }, (_, index) => {
        const left = `${((index + 1) / (columnCount + 1)) * 100}%`;
        const isActive = !reduce && index === activeIndex;
        return (
          <div
            className="absolute inset-y-0 w-px bg-border transition-[opacity,box-shadow] duration-[1500ms] ease-in-out"
            key={`${id}-${index}`}
            style={{
              left,
              opacity: isActive ? 1 : 0.4,
              boxShadow: isActive ? `0 0 12px 1px ${glowColor}` : "none",
            }}
          />
        );
      })}
    </div>
  );
}
