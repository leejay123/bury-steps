"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ComponentProps, ReactNode } from "react";

export const motionEase = [0.22, 1, 0.36, 1] as const;

/** Shared enter timing for overlay panel content when Framer is used. */
export const overlayMotionTransition = {
  duration: 0.28,
  ease: motionEase,
} as const;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export function FadeIn({
  children,
  className,
  delay = 0,
  inView = true,
  ...props
}: {
  children: ReactNode;
  delay?: number;
  inView?: boolean;
} & Omit<ComponentProps<typeof motion.div>, "children">) {
  const reduce = useReducedMotion();
  const transition = { duration: 0.45, delay, ease: motionEase };

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      transition={transition}
      variants={fadeUp}
      {...(inView
        ? { viewport: { once: true, amount: 0.18, margin: "0px 0px -40px 0px" }, whileInView: "show" }
        : { animate: "show" })}
      {...props}
    >
      {children}
    </motion.div>
  );
}

