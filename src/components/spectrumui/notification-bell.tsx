/**
 * Spectrum UI — NotificationBell
 * https://ui.spectrumhq.in/docs/notification-bell
 * Apache License 2.0. Adapted for the site header: theme tokens, a
 * forwarded ref so it can sit inside DrawerTrigger, and "notices" wording.
 *
 * When the unread count increases the bell swings from its hinge and the
 * badge springs in and rolls its count. Honors prefers-reduced-motion.
 */

"use client";

import { useState } from "react";
import type React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface NotificationBellProps extends Omit<
  React.ComponentProps<typeof motion.button>,
  "children"
> {
  /** Number of unread notices. Default 0 */
  count?: number;
  /** Counts above this render as "max+". Default 99 */
  max?: number;
  /** Show a small pinging dot instead of the numeric badge. Default false */
  dot?: boolean;
  /** Play the ring swing once when the component mounts. Default false */
  ringOnMount?: boolean;
  /** Visual size of the button. Default "md" */
  size?: "sm" | "md" | "lg";
}

/** Seconds a full ring swing takes to settle */
const SWING_DURATION = 0.9;
/** Bell rotation keyframes — amplitude decays like a released pendulum */
const BELL_SWING = [0, 15, -12, 8, -5, 3, -1.5, 0];
/** Clapper counter-rotation; same keyframe count so it stays in phase */
const CLAPPER_SWING = [0, -17, 14, -10, 6, -3.5, 2, 0];
/**
 * Keyframe times — a quick initial impulse, then near-constant half-periods
 * so the decay reads as physics rather than a linear ramp
 */
const SWING_TIMES = [0, 0.1, 0.26, 0.42, 0.58, 0.74, 0.88, 1];
const SWING_EASE = "easeInOut" as const;

const PING_DURATION = 0.9;
const BADGE_SPRING = { type: "spring", stiffness: 500, damping: 22 } as const;
const COUNT_SPRING = { type: "spring", stiffness: 400, damping: 30 } as const;
const TAP_SPRING = { type: "spring", stiffness: 500, damping: 30 } as const;

const BELL_DOME_PATH = "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9";
const BELL_CLAPPER_PATH = "M10.3 21a1.94 1.94 0 0 0 3.4 0";

const SIZES = {
  sm: { button: "size-9", icon: 16 },
  md: { button: "size-11", icon: 20 },
  lg: { button: "size-[52px]", icon: 24 },
} as const;

const countVariants = {
  enter: (direction: number) => ({ y: direction * 10, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (direction: number) => ({ y: direction * -10, opacity: 0 }),
};

export function NotificationBell({
  count = 0,
  max = 99,
  dot = false,
  ringOnMount = false,
  size = "md",
  className,
  ref,
  ...props
}: NotificationBellProps) {
  const shouldReduceMotion = useReducedMotion();
  const [trackedCount, setTrackedCount] = useState(count);
  const [direction, setDirection] = useState(1);
  const [ringKey, setRingKey] = useState(() => (ringOnMount && count > 0 ? 1 : 0));

  if (count !== trackedCount) {
    setTrackedCount(count);
    setDirection(count > trackedCount ? 1 : -1);
    if (count > trackedCount) setRingKey((key) => key + 1);
  }

  const { button: sizeClasses, icon } = SIZES[size];
  const displayValue = count > max ? `${max}+` : String(count);

  const swinging = ringKey > 0 && !shouldReduceMotion;
  const swingTransition = swinging
    ? { duration: SWING_DURATION, times: SWING_TIMES, ease: SWING_EASE }
    : { duration: 0 };
  const badgeTransition = shouldReduceMotion ? { duration: 0 } : BADGE_SPRING;

  return (
    <motion.button
      ref={ref}
      transition={TAP_SPRING}
      type="button"
      whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
      {...props}
      aria-label={count > 0 ? `${count} unread notices` : "Notices"}
      className={cn(
        "relative inline-flex touch-manipulation select-none items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-accent",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        sizeClasses,
        className,
      )}
    >
      <motion.span
        animate={swinging ? { rotate: BELL_SWING } : { rotate: 0 }}
        className="inline-flex"
        initial={{ rotate: 0 }}
        key={`bell-${ringKey}`}
        style={{ transformOrigin: "top center" }}
        transition={swingTransition}
      >
        <svg
          aria-hidden="true"
          fill="none"
          height={icon}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width={icon}
        >
          <path d={BELL_DOME_PATH} />
          <motion.path
            animate={swinging ? { rotate: CLAPPER_SWING } : { rotate: 0 }}
            d={BELL_CLAPPER_PATH}
            initial={{ rotate: 0 }}
            style={{ transformBox: "fill-box", transformOrigin: "top center" }}
            transition={swingTransition}
          />
        </svg>
      </motion.span>

      {dot ? (
        <AnimatePresence initial={false}>
          {count > 0 ? (
            <motion.span
              animate={{ scale: 1 }}
              aria-hidden="true"
              className="absolute top-1 right-1 flex size-2.5"
              exit={{ scale: 0 }}
              initial={{ scale: 0 }}
              key="dot"
              transition={badgeTransition}
            >
              {swinging ? (
                <motion.span
                  animate={{ scale: 2, opacity: 0 }}
                  className="absolute inset-0 rounded-full bg-destructive"
                  initial={{ scale: 1, opacity: 0.6 }}
                  key={`ping-${ringKey}`}
                  transition={{ duration: PING_DURATION, ease: "easeOut" }}
                />
              ) : null}
              <span className="relative size-2.5 rounded-full bg-destructive" />
            </motion.span>
          ) : null}
        </AnimatePresence>
      ) : (
        <AnimatePresence initial={false}>
          {count > 0 ? (
            <motion.span
              animate={{ scale: 1 }}
              aria-hidden="true"
              className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-background"
              exit={{ scale: 0 }}
              initial={{ scale: 0 }}
              key="badge"
              style={{ transformOrigin: "left bottom" }}
              transition={badgeTransition}
            >
              <span className="relative inline-flex overflow-hidden tabular-nums">
                <AnimatePresence custom={direction} initial={false} mode="popLayout">
                  <motion.span
                    animate="center"
                    className="inline-block"
                    custom={direction}
                    exit="exit"
                    initial="enter"
                    key={displayValue}
                    transition={shouldReduceMotion ? { duration: 0 } : COUNT_SPRING}
                    variants={countVariants}
                  >
                    {displayValue}
                  </motion.span>
                </AnimatePresence>
              </span>
            </motion.span>
          ) : null}
        </AnimatePresence>
      )}

      <span aria-live="polite" className="sr-only" role="status">
        {count > 0 ? `${count} unread notice${count === 1 ? "" : "s"}` : ""}
      </span>
    </motion.button>
  );
}
