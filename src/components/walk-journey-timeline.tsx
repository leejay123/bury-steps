"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/dates";
import type { JourneyEventView } from "@/lib/walk-journey";

function JourneyItem({
  title,
  body,
  happenedAt,
  index,
  reduceMotion,
}: JourneyEventView & { index: number; reduceMotion: boolean }) {
  const isEven = index % 2 === 0;

  return (
    <div className="relative grid grid-cols-1 items-center gap-4 md:grid-cols-2 md:gap-0">
      <div
        className={cn(
          "z-10 flex flex-col justify-center p-0 md:p-8",
          isEven ? "md:items-end md:text-right" : "md:order-2",
        )}
      >
        {reduceMotion ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm tabular-nums text-muted-foreground">{formatTime(happenedAt)}</p>
            <h3 className="text-lg font-medium tracking-tight text-foreground md:text-xl">
              {title}
            </h3>
            {body ? (
              <p className="text-sm leading-relaxed text-muted-foreground md:text-base">{body}</p>
            ) : null}
          </div>
        ) : (
          <motion.div
            className="flex flex-col gap-2"
            initial={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            viewport={{ once: true, margin: "-80px" }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <p className="text-sm tabular-nums text-muted-foreground">{formatTime(happenedAt)}</p>
            <h3 className="text-lg font-medium tracking-tight text-foreground md:text-xl">
              {title}
            </h3>
            {body ? (
              <p className="text-sm leading-relaxed text-muted-foreground md:text-base">{body}</p>
            ) : null}
          </motion.div>
        )}
      </div>
      <div aria-hidden className={cn("hidden md:block", isEven ? "md:order-2" : "")} />
    </div>
  );
}

/**
 * Animated journey timeline for use inside a drawer (not on the main page).
 * Scroll-linked line stays local to the drawer scroller so the walk page
 * itself stays light.
 */
export function WalkJourneyTimeline({
  className,
  events,
}: {
  className?: string;
  events: JourneyEventView[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });
  const dotTop = useTransform(smoothProgress, [0, 1], ["0%", "100%"]);

  if (events.length === 0) return null;

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <div className="absolute top-0 bottom-0 left-3 w-px bg-border md:left-1/2 md:-translate-x-1/2" />
      <div className="absolute top-0 bottom-0 left-3 w-px md:left-1/2 md:-translate-x-1/2">
        {reduceMotion ? (
          <div className="absolute inset-0 w-full bg-foreground" />
        ) : (
          <>
            <motion.div
              className="absolute inset-0 w-full origin-top bg-foreground"
              style={{ scaleY: smoothProgress }}
            />
            <motion.div
              className="absolute left-1/2 z-30 hidden size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-foreground md:block"
              style={{ top: dotTop }}
            />
          </>
        )}
      </div>
      <div className="flex flex-col gap-10 py-2 pl-8 md:gap-0 md:px-0 md:py-0">
        {events.map((event, index) => (
          <JourneyItem key={event.id} {...event} index={index} reduceMotion={reduceMotion} />
        ))}
      </div>
    </div>
  );
}
