"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";

import { cn } from "@/lib/utils";

interface NumberTickerProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number;
  startValue?: number;
  /** Seconds to wait after entering the viewport */
  delay?: number;
  decimalPlaces?: number;
  prefix?: string;
  suffix?: string;
}

export function NumberTicker({
  value,
  startValue = 0,
  delay = 0,
  decimalPlaces = 0,
  prefix = "",
  suffix = "",
  className,
  ...props
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(startValue);
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
  });
  const isInView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reducedMotion = useReducedMotion();

  const format = useMemo(() => {
    const number = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });
    return (n: number) => `${prefix}${number.format(n)}${suffix}`;
  }, [prefix, suffix, decimalPlaces]);

  useEffect(() => {
    if (!isInView) return;
    if (reducedMotion) {
      // jump() on the source alone still makes the spring follow it,
      // so jump the spring too to skip the count-up entirely
      motionValue.jump(value);
      springValue.jump(value);
      return;
    }
    const timeout = setTimeout(() => motionValue.set(value), delay * 1000);
    return () => clearTimeout(timeout);
  }, [isInView, reducedMotion, motionValue, springValue, value, delay]);

  // The spring keeps easing for a few seconds after the number on screen
  // has stopped changing. Only touch the page when the text differs: writing
  // it every frame re-laid out the hero ~60 times a second, which made
  // scrolling stutter on slower computers.
  useEffect(() => {
    let shown = ref.current?.textContent ?? "";
    return springValue.on("change", (latest) => {
      const next = format(latest);
      if (next === shown || !ref.current) return;
      shown = next;
      ref.current.textContent = next;
    });
  }, [springValue, format]);

  return (
    <span
      data-slot="number-ticker"
      className={cn("inline-block tabular-nums", className)}
      {...props}
    >
      <span className="sr-only">{format(value)}</span>
      <span ref={ref} aria-hidden>
        {format(startValue)}
      </span>
    </span>
  );
}
