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

export function MotionPage({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}

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

export function Stagger({
  children,
  className,
  delay = 0,
  inView = true,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  inView?: boolean;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial="hidden"
      variants={{
        hidden: {},
        show: {
          transition: {
            delayChildren: delay,
            staggerChildren: reduce ? 0 : 0.08,
          },
        },
      }}
      {...(inView
        ? { viewport: { once: true, amount: 0.12 }, whileInView: "show" }
        : { animate: "show" })}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={{
        hidden: reduce ? { opacity: 1, y: 0 } : fadeUp.hidden,
        show: {
          ...fadeUp.show,
          transition: { duration: 0.4, ease: motionEase },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function HoverLift({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      transition={{ duration: 0.2, ease: motionEase }}
      whileHover={reduce ? undefined : { y: -3 }}
      whileTap={reduce ? undefined : { scale: 0.99 }}
    >
      {children}
    </motion.div>
  );
}
