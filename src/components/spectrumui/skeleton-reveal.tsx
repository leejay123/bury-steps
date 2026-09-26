/**
 * Spectrum UI — SkeletonReveal
 * https://ui.spectrumhq.in/docs/skeleton-reveal
 * Apache License 2.0. The motion is the skeleton-loader-and-reveal recipe
 * from transitions.dev (Jakub Antalík): the skeleton pulses while loading,
 * then cross-fades and un-blurs into the content in the same slot.
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonRevealProps {
  /** While true the skeleton shows and pulses; flipping to false reveals the content */
  loading: boolean;
  /** Placeholder layer, sized like the content */
  skeleton: React.ReactNode;
  /** Real content, rendered in the same slot */
  children: React.ReactNode;
  /** Pulse cycles before settling. Default 1 */
  pulseCount?: number;
  /** One pulse cycle in ms. Default 1000 */
  pulseDuration?: number;
  /** Cross-fade duration in ms. Default 400 */
  revealDuration?: number;
  className?: string;
}

const CSS = `
.t-skel{position:relative}
.t-skel-skeleton{position:absolute;inset:0;z-index:1;opacity:1;filter:blur(0);transition:opacity var(--reveal-dur) var(--reveal-ease),filter var(--reveal-dur) var(--reveal-ease)}
.t-skel-content{position:relative;z-index:2;opacity:0;filter:blur(var(--reveal-blur));pointer-events:none;transition:opacity var(--reveal-dur) var(--reveal-ease),filter var(--reveal-dur) var(--reveal-ease)}
.t-skel.is-revealed .t-skel-content{pointer-events:auto}
.t-skel.is-revealed .t-skel-skeleton{opacity:0;filter:blur(var(--reveal-blur));pointer-events:none}
.t-skel.is-revealed .t-skel-content{opacity:1;filter:blur(0)}
.t-skel.is-resetting .t-skel-skeleton,.t-skel.is-resetting .t-skel-content{transition:none !important}
.t-skel-skeleton.is-pulsing > *{animation:t-skel-pulse var(--pulse-dur) ease-in-out var(--pulse-count)}
@keyframes t-skel-pulse{0%,100%{opacity:1}50%{opacity:var(--pulse-min)}}
@media (prefers-reduced-motion: reduce){.t-skel-skeleton,.t-skel-content{transition:none !important}.t-skel-skeleton.is-pulsing > *{animation:none !important}}
`;

export function SkeletonReveal({
  loading,
  skeleton,
  children,
  pulseCount = 1,
  pulseDuration = 1000,
  revealDuration = 400,
  className,
}: SkeletonRevealProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const wasLoading = React.useRef(loading);

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (loading && !wasLoading.current) {
      el.classList.add("is-resetting");
      void el.offsetWidth;
      el.classList.remove("is-resetting");
    }
    wasLoading.current = loading;
  }, [loading]);

  return (
    <>
      <style>{CSS}</style>
      <div
        aria-busy={loading || undefined}
        className={cn("t-skel", !loading && "is-revealed", className)}
        ref={ref}
        style={
          {
            "--pulse-dur": `${pulseDuration}ms`,
            "--pulse-count": pulseCount,
            "--pulse-min": 0.5,
            "--reveal-dur": `${revealDuration}ms`,
            "--reveal-blur": "2px",
            "--reveal-ease": "ease-in-out",
          } as React.CSSProperties
        }
      >
        <div aria-hidden className={cn("t-skel-skeleton", loading && "is-pulsing")}>
          {skeleton}
        </div>
        <div className="t-skel-content">{children}</div>
      </div>
    </>
  );
}
